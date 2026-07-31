import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateText, Output } from "ai";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Criterion = { no: number; name: string; max: number; guidance: string };

const ragOf = (total: number, max: number): "red" | "amber" | "green" => {
  const p = max > 0 ? total / max : 0;
  if (p >= 0.8) return "green";
  if (p >= 0.5) return "amber";
  return "red";
};

const RunAuditInput = z.object({
  framework_id: z.string().uuid(),
  coach_id: z.string().uuid(),
  transcript: z.string().min(1),
  turns: z.array(z.object({ speaker: z.string(), text: z.string() })).optional().nullable(),
  guidance: z.string().optional().nullable(),
  source: z
    .object({
      type: z.enum(["url", "upload", "paste"]),
      url: z.string().nullable().optional(),
      file_name: z.string().nullable().optional(),
      language: z.string().nullable().optional(),
      duration: z.number().nullable().optional(),
    })
    .optional()
    .nullable(),
});

export const runAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RunAuditInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");

    // Load framework
    const { data: fw, error: fwErr } = await supabase
      .from("audit_frameworks")
      .select("id,name,kind,total_max_score,zero_tolerance,criteria")
      .eq("id", data.framework_id)
      .single();
    if (fwErr || !fw) throw new Error("Framework not found");

    const criteria = (fw.criteria as unknown as Criterion[]) ?? [];
    if (criteria.length === 0) throw new Error("Framework has no criteria configured");

    // Build dialogue text (prefer labelled turns)
    const dialogue =
      data.turns && data.turns.length > 0
        ? data.turns.map((t) => `${t.speaker}: ${t.text}`).join("\n")
        : data.transcript;

    const criteriaList = criteria
      .map((c) => `  ${c.no}. ${c.name} (max ${c.max}) — ${c.guidance}`)
      .join("\n");

    const systemPrompt = `You are a strict NHS quality auditor for ${fw.kind === "chat" ? "coaching chats" : "coaching calls"}.
You will score the conversation against each parameter below using this scale:
  0 = Poor / not done
  1 = Somewhat done / partially met
  2 = Done correctly / fully met

Parameters:
${criteriaList}

${fw.zero_tolerance ? `ZERO-TOLERANCE RULE (if hit, set zero_tolerance_hit=true and explain): ${fw.zero_tolerance}` : ""}

Rules:
- Score every parameter. Use only 0, 1, or 2.
- Cite a short evidence quote from the transcript for each score (verbatim, <= 200 chars). If no evidence exists, return an empty string.
- Be objective and concise in reasoning (1-2 sentences per parameter).
- Then produce an overall summary, 2-4 strengths, and 2-4 improvement areas.`;

    const userPrompt = `Audit guidance from the expert (optional, may be empty):
${data.guidance?.trim() || "(none)"}

Conversation transcript:
"""
${dialogue}
"""`;

    const { createClaudeProvider } = await import("@/lib/ai-provider.server");
    const claude = createClaudeProvider(apiKey);
    const model = claude("claude-sonnet-4-5");

    const schema = z.object({
      parameters: z.array(
        z.object({
          no: z.number().int(),
          name: z.string(),
          score: z.number().int().min(0).max(2),
          reasoning: z.string(),
          evidence_quote: z.string(),
        }),
      ),
      zero_tolerance_hit: z.boolean(),
      zero_tolerance_reason: z.string().optional().nullable(),
      summary: z.string(),
      strengths: z.array(z.string()),
      improvements: z.array(z.string()),
    });

    const ai = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
      experimental_output: Output.object({ schema }),
    });

    const parsed = (ai as unknown as { experimental_output?: z.infer<typeof schema> }).experimental_output;
    if (!parsed) throw new Error("AI returned no structured output");

    // Compute totals from per-parameter scores, ensure all criteria covered
    const byNo = new Map(parsed.parameters.map((p) => [p.no, p]));
    let total = 0;
    const max = criteria.reduce((s, c) => s + c.max, 0);
    for (const c of criteria) {
      const p = byNo.get(c.no);
      total += Math.min(c.max, Math.max(0, p?.score ?? 0));
    }
    let rag = ragOf(total, max);
    if (parsed.zero_tolerance_hit) rag = "red";

    // Persist transcript first (if not already provided)
    const { data: ct, error: ctErr } = await supabase
      .from("call_transcripts")
      .insert({
        source_type: data.source?.type ?? "url",
        source_url: data.source?.url ?? null,
        file_name: data.source?.file_name ?? null,
        language: data.source?.language ?? null,
        duration_seconds: data.source?.duration ?? null,
        transcript: data.transcript,
        segments: (data.turns ?? null) as any,
      })
      .select("id")
      .single();
    if (ctErr || !ct) throw new Error(`Could not save transcript: ${ctErr?.message}`);

    // The expert running this audit is the currently authenticated user.
    const { data: expertRow } = await supabase
      .from("experts")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();
    const expertId = expertRow?.id ?? null;

    // coach_id is now explicitly selected by the auditor in the UI (a searchable
    // dropdown of all coaches) rather than guessed. We still validate it exists
    // to give a clear error instead of a raw FK violation.
    const { data: coachRow, error: coachErr } = await supabase
      .from("coaches")
      .select("id")
      .eq("id", data.coach_id)
      .maybeSingle();
    if (coachErr || !coachRow) throw new Error("Selected coach not found.");
    const coachId = coachRow.id;

    // Insert audit
    const { data: audit, error: aErr } = await supabase
      .from("audits")
      .insert({
        coach_id: coachId,
        expert_id: expertId,
        framework_id: fw.id,
        title: `${fw.name} — ${new Date().toISOString().slice(0, 10)}`,
        status: "pending_review",
        rag,
        total_score: total,
        max_score: max,
        conducted_at: new Date().toISOString(),
        created_by: userId,
        ai_result: { ...parsed, total, max, rag },
        guidance: data.guidance ?? null,
        zero_tolerance_hit: parsed.zero_tolerance_hit,
        call_transcript_id: ct.id,
        locked: false,
      })
      .select("id")
      .single();
    if (aErr || !audit) throw new Error(`Could not save audit: ${aErr?.message}`);

    // Link transcript back to audit
    await supabase.from("call_transcripts").update({ audit_id: audit.id }).eq("id", ct.id);

    // Insert per-parameter scores
    const rows = criteria.map((c) => {
      const p = byNo.get(c.no);
      return {
        audit_id: audit.id,
        criterion: `${c.no}. ${c.name}`,
        criterion_no: c.no,
        score: Math.min(c.max, Math.max(0, p?.score ?? 0)),
        max_score: c.max,
        weight: 1,
        reasoning: p?.reasoning ?? null,
        evidence_quote: p?.evidence_quote ?? null,
      };
    });
    const { error: sErr } = await supabase.from("audit_scores").insert(rows);
    if (sErr) throw new Error(`Could not save audit scores: ${sErr.message}`);

    return { audit_id: audit.id, result: { ...parsed, total, max, rag } };
  });

// ---- Challenge / save edits ----

const ChallengeInput = z.object({
  audit_id: z.string().uuid(),
  edits: z.array(
    z.object({
      criterion_no: z.number().int(),
      score: z.number().int().min(0).max(2),
      expert_note: z.string().optional().nullable(),
    }),
  ),
});

export const saveExpertChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ChallengeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: audit, error } = await supabase
      .from("audits")
      .select("id,locked,re_edit_allowed,max_score")
      .eq("id", data.audit_id)
      .single();
    if (error || !audit) throw new Error("Audit not found");
    if (audit.locked && !audit.re_edit_allowed) {
      throw new Error("This audit is locked and cannot be edited.");
    }

    // Apply edits
    for (const e of data.edits) {
      const { error: upErr } = await supabase
        .from("audit_scores")
        .update({ score: e.score, expert_note: e.expert_note ?? null })
        .eq("audit_id", data.audit_id)
        .eq("criterion_no", e.criterion_no);
      if (upErr) throw new Error(upErr.message);
    }

    // Recompute total
    const { data: scores } = await supabase
      .from("audit_scores")
      .select("score,max_score")
      .eq("audit_id", data.audit_id);
    const total = (scores ?? []).reduce((s, r) => s + Number(r.score), 0);
    const max = (scores ?? []).reduce((s, r) => s + Number(r.max_score), 0);
    const rag = ragOf(total, max);

    const { error: aErr } = await supabase
      .from("audits")
      .update({
        total_score: total,
        max_score: max,
        rag,
        locked: true,
        edited_by_expert: true,
        re_edit_allowed: false,
      })
      .eq("id", data.audit_id);
    if (aErr) throw new Error(aErr.message);

    return { ok: true, total, max, rag };
  });

const CoachChallengeInput = z.object({ audit_id: z.string().uuid() });

export const coachChallengeAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CoachChallengeInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: audit, error } = await supabase
      .from("audits")
      .select("id,locked,challenge_count")
      .eq("id", data.audit_id)
      .single();
    if (error || !audit) throw new Error("Audit not found");
    if (!audit.locked) throw new Error("Audit is not yet saved by the expert.");
    if ((audit.challenge_count ?? 0) >= 1) {
      throw new Error("This audit has already been challenged once.");
    }
    const { error: uErr } = await supabase
      .from("audits")
      .update({
        challenge_count: (audit.challenge_count ?? 0) + 1,
        re_edit_allowed: true,
        locked: false,
      })
      .eq("id", data.audit_id);
    if (uErr) throw new Error(uErr.message);
    return { ok: true };
  });

// ---- List frameworks ----

export const listFrameworks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("audit_frameworks")
      .select("id,name,kind,total_max_score,zero_tolerance,criteria")
      .eq("is_active", true)
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });
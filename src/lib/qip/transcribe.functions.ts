import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const GOQII_ENDPOINT = "https://apiv6.goqii.com/vertex/recording";
const GOQII_CLIENT_ID = "5tra1IQYBCog7Wcaqtd7aa7f";
const DIALOGUE_PROMPT =
  "Transcribe this call in dialogue format. Two speakers: COACH (initiates call, asks questions, gives advice) and PLAYER (answers questions, shares health info). Format: COACH: [text] PLAYER: [text]. Never merge turns. No timestamps or commentary.";

export type DialogueTurn = { speaker: "COACH" | "PLAYER"; text: string };
export type TranscribeResult = {
  text: string;
  turns: DialogueTurn[];
  language?: string;
  duration?: number;
  segments?: null;
};

function parseTurns(raw: string): DialogueTurn[] {
  if (!raw || typeof raw !== "string") return [];
  // Match "COACH:" / "PLAYER:" prefixes (case-insensitive). They can appear
  // at the start of a line or inline if the API returned everything in one line.
  const re = /(COACH|PLAYER)\s*:\s*/gi;
  const matches: Array<{ speaker: "COACH" | "PLAYER"; index: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    matches.push({
      speaker: m[1].toUpperCase() as "COACH" | "PLAYER",
      index: m.index,
      end: m.index + m[0].length,
    });
  }
  const turns: DialogueTurn[] = [];
  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const next = matches[i + 1];
    const text = raw.slice(cur.end, next?.index ?? raw.length).trim();
    if (text) turns.push({ speaker: cur.speaker, text });
  }
  return turns;
}

async function callDialogueApi(fileUrl: string): Promise<TranscribeResult> {
  const secret = process.env.GOQII_CLIENT_SECRET;
  if (!secret) throw new Error("GOQII_CLIENT_SECRET is not configured");
  const res = await fetch(GOQII_ENDPOINT, {
    method: "POST",
    headers: {
      clientId: GOQII_CLIENT_ID,
      clientSecret: secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ file: fileUrl, prompt: DIALOGUE_PROMPT }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Transcription failed (${res.status}): ${body.slice(0, 400)}`);
  }
  const ct = res.headers.get("content-type") || "";
  let json: any;
  let rawText: string;
  if (ct.includes("application/json")) {
    json = await res.json();
    console.log("Goqii raw response keys:", typeof json, json && Object.keys(json));
    rawText =
      (typeof json === "string" && json) ||
      json?.text ||
      json?.transcript ||
      json?.transcription ||
      json?.data?.text ||
      json?.data?.transcript ||
      json?.data ||
      json?.result ||
      json?.response ||
      json?.output ||
      "";
    if (typeof rawText !== "string") rawText = JSON.stringify(rawText);
  } else {
    rawText = await res.text();
    json = { _text: rawText };
    console.log("Goqii raw text length:", rawText.length);
  }
  const turns = parseTurns(rawText);
  return {
    text: rawText,
    turns,
    language: json?.language ?? json?.detected_language,
    duration: json?.duration ?? json?.audio_duration,
    segments: null,
    // @ts-expect-error keep raw for debugging
    _raw: json,
  };
}

export const transcribeUpload = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Expected FormData");
    const file = input.get("file");
    if (!(file instanceof File)) throw new Error("Missing audio file");
    return { file };
  })
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const file = data.file;
    if (file.size > 25 * 1024 * 1024) throw new Error("File exceeds 25MB limit");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ext = (file.name.split(".").pop() || "mp3").toLowerCase().replace(/[^a-z0-9]/g, "");
    const objectPath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext || "mp3"}`;
    const buf = await file.arrayBuffer();
    const { error: upErr } = await supabaseAdmin.storage
      .from("call-recordings")
      .upload(objectPath, buf, {
        contentType: file.type || "audio/mpeg",
        upsert: false,
      });
    if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("call-recordings")
      .createSignedUrl(objectPath, 60 * 60); // 1h
    if (signErr || !signed?.signedUrl) throw new Error(`Could not sign URL: ${signErr?.message ?? "unknown"}`);
    return callDialogueApi(signed.signedUrl);
  });

export const transcribeUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const obj = input as { url?: string };
    if (!obj?.url || typeof obj.url !== "string") throw new Error("Missing url");
    try { new URL(obj.url); } catch { throw new Error("Invalid url"); }
    return { url: obj.url };
  })
  .handler(async ({ data }) => {
    return callDialogueApi(data.url);
  });

export const saveTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const o = input as any;
    if (!o || typeof o.transcript !== "string" || o.transcript.length === 0) throw new Error("Transcript is required");
    if (o.transcript.length > 200000) throw new Error("Transcript too large");
    if (o.source_type !== "url" && o.source_type !== "upload") throw new Error("Invalid source_type");
    return {
      transcript: o.transcript as string,
      language: typeof o.language === "string" ? o.language : null,
      duration_seconds: typeof o.duration === "number" ? o.duration : null,
      segments: o.segments ?? null,
      raw: o.raw ?? null,
      source_type: o.source_type as "url" | "upload",
      source_url: typeof o.source_url === "string" ? o.source_url : null,
      file_name: typeof o.file_name === "string" ? o.file_name : null,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("call_transcripts")
      .insert({
        created_by: userId,
        transcript: data.transcript,
        language: data.language,
        duration_seconds: data.duration_seconds,
        segments: data.segments,
        raw: data.raw,
        source_type: data.source_type,
        source_url: data.source_url,
        file_name: data.file_name,
      })
      .select("id, expires_at")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string, expires_at: row.expires_at as string };
  });
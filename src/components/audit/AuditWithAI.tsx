import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Sparkles, AlertTriangle, Lock, Edit3, Eye } from "lucide-react";
import { toast } from "sonner";
import { runAudit, saveExpertChallenge, listFrameworks } from "@/lib/qip/audit.functions";

type Turn = { speaker: string; text: string };
type ParamResult = { no: number; name: string; score: number; reasoning: string; evidence_quote: string };
type AIResult = {
  parameters: ParamResult[];
  zero_tolerance_hit: boolean;
  zero_tolerance_reason?: string | null;
  summary: string;
  strengths: string[];
  improvements: string[];
  total: number;
  max: number;
};

export function AuditWithAI({
  transcript,
  turns,
  source,
  defaultKind,
  previewOnly = false,
}: {
  transcript?: string;
  turns?: Turn[];
  source?: { type: "url" | "upload" | "paste"; url?: string; file_name?: string; language?: string | null; duration?: number | null };
  defaultKind: "call" | "chat";
  previewOnly?: boolean;
}) {
  const run = useServerFn(runAudit);
  const save = useServerFn(saveExpertChallenge);
  const fetchFrameworks = useServerFn(listFrameworks);

  const { data: frameworks } = useQuery({
    queryKey: ["frameworks"],
    queryFn: () => fetchFrameworks(),
  });

  const { data: coaches } = useQuery({
    queryKey: ["coaches-for-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaches")
        .select("id, profiles!coaches_profile_id_fkey(full_name, employee_code)")
        .order("id");
      if (error) throw new Error(error.message);
      return (data ?? []) as Array<{ id: string; profiles: { full_name: string; employee_code: string | null } | null }>;
    },
  });

  const callable = (frameworks ?? []).filter((f) => f.kind === defaultKind);
  const [open, setOpen] = useState(false);
  const [frameworkId, setFrameworkId] = useState<string>("");
  const [coachId, setCoachId] = useState<string>("");
  const [coachSearch, setCoachSearch] = useState("");
  const [guidance, setGuidance] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const [auditId, setAuditId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [edits, setEdits] = useState<Record<number, { score: number; expert_note: string }>>({});
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleRun() {
    if (previewOnly || !transcript || !source) {
      toast.message("Transcribe a call/chat first, then click Audit with AI from there.");
      return;
    }
    const fid = frameworkId || callable[0]?.id;
    if (!fid) {
      toast.error("Select a framework");
      return;
    }
    if (!coachId) {
      toast.error("Select the coach this call/chat belongs to");
      return;
    }
    setRunning(true);
    try {
      const res = await run({
        data: {
          framework_id: fid,
          coach_id: coachId,
          transcript,
          turns: turns ?? [],
          guidance: guidance.trim() || null,
          source,
        },
      });
      setResult(res.result as AIResult);
      setAuditId(res.audit_id);
      setLocked(false);
      setEditing(false);
      setEdits({});
      setOpen(false);
      toast.success("Audit complete and auto-saved");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Audit failed");
    } finally {
      setRunning(false);
    }
  }

  function startEdit() {
    if (!result) return;
    const map: Record<number, { score: number; expert_note: string }> = {};
    for (const p of result.parameters) map[p.no] = { score: p.score, expert_note: "" };
    setEdits(map);
    setEditing(true);
  }

  async function handleSaveEdits() {
    if (!auditId) return;
    setSaving(true);
    try {
      const payload = Object.entries(edits).map(([no, v]) => ({
        criterion_no: Number(no),
        score: v.score,
        expert_note: v.expert_note || null,
      }));
      const r = await save({ data: { audit_id: auditId, edits: payload } });
      toast.success("Audit saved and locked");
      // Reflect locally
      if (result) {
        const updated = result.parameters.map((p) => ({
          ...p,
          score: edits[p.no]?.score ?? p.score,
        }));
        setResult({ ...result, parameters: updated, total: r.total, max: r.max });
      }
      setEditing(false);
      setLocked(true);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="secondary">
            {previewOnly ? (
              <><Eye className="mr-2 h-4 w-4" /> Preview audit guidance form</>
            ) : (
              <><Sparkles className="mr-2 h-4 w-4" /> Audit with AI</>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{previewOnly ? "Audit guidance form (preview)" : "Run AI audit"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewOnly && (
              <p className="text-xs text-muted-foreground">
                This is the form an expert sees before running an audit. Transcribe a call/chat to actually run it.
              </p>
            )}
            <div className="space-y-2">
              <Label>Framework</Label>
              <Select value={frameworkId || callable[0]?.id || ""} onValueChange={setFrameworkId}>
                <SelectTrigger><SelectValue placeholder="Select framework" /></SelectTrigger>
                <SelectContent>
                  {(frameworks ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name} ({f.kind})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!previewOnly && (
              <div className="space-y-2">
                <Label>Coach</Label>
                <Input
                  placeholder="Search coach by name or employee code…"
                  value={coachSearch}
                  onChange={(e) => setCoachSearch(e.target.value)}
                  className="mb-1"
                />
                <Select value={coachId} onValueChange={setCoachId}>
                  <SelectTrigger><SelectValue placeholder="Select the coach on this call/chat" /></SelectTrigger>
                  <SelectContent>
                    {(coaches ?? [])
                      .filter((c) => {
                        const q = coachSearch.trim().toLowerCase();
                        if (!q) return true;
                        const name = c.profiles?.full_name?.toLowerCase() ?? "";
                        const code = c.profiles?.employee_code?.toLowerCase() ?? "";
                        return name.includes(q) || code.includes(q);
                      })
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.profiles?.full_name ?? "Unnamed coach"}
                          {c.profiles?.employee_code ? ` (${c.profiles.employee_code})` : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  This is who the audit score gets attributed to.
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Guidance for the AI (optional)</Label>
              <Textarea
                value={guidance}
                onChange={(e) => setGuidance(e.target.value)}
                placeholder="E.g. Focus on empathy. Strict on zero-tolerance. Player is a long-standing diabetes case."
                rows={4}
              />
              <p className="text-[11px] text-muted-foreground">
                The AI will treat this as ground rules in addition to the framework parameters.
              </p>
            </div>
          </div>
          <DialogFooter>
            {previewOnly ? (
              <Button variant="outline" onClick={() => setOpen(false)}>Close preview</Button>
            ) : (
              <Button onClick={handleRun} disabled={running}>
                {running ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Auditing…</> : <><Sparkles className="mr-2 h-4 w-4" />Run audit</>}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {result && (
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="text-lg font-semibold">
                Score: {result.total} / {result.max}
              </div>
              {result.zero_tolerance_hit && (
                <Badge className="border bg-rose-500/15 text-rose-700 border-rose-500/30">
                  <AlertTriangle className="mr-1 h-3 w-3" /> Zero-tolerance hit
                </Badge>
              )}
              {locked && (
                <Badge variant="outline"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>
              )}
            </div>
            {!locked && !editing && (
              <Button size="sm" variant="outline" onClick={startEdit}>
                <Edit3 className="mr-2 h-4 w-4" /> Challenge / edit
              </Button>
            )}
          </div>

          {result.zero_tolerance_hit && result.zero_tolerance_reason && (
            <div className="rounded border border-rose-500/30 bg-rose-500/5 p-2 text-xs text-rose-700">
              {result.zero_tolerance_reason}
            </div>
          )}

          <div className="space-y-2">
            {result.parameters
              .slice()
              .sort((a, b) => a.no - b.no)
              .map((p) => (
                <div key={p.no} className="rounded border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-sm">{p.no}. {p.name}</div>
                    {editing ? (
                      <Select
                        value={String(edits[p.no]?.score ?? p.score)}
                        onValueChange={(v) =>
                          setEdits((cur) => ({
                            ...cur,
                            [p.no]: { score: Number(v), expert_note: cur[p.no]?.expert_note ?? "" },
                          }))
                        }
                      >
                        <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant="outline">{p.score} / 2</Badge>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.reasoning}</div>
                  {p.evidence_quote && (
                    <div className="mt-2 rounded bg-secondary/40 px-2 py-1 text-[11px] italic">
                      "{p.evidence_quote}"
                    </div>
                  )}
                  {editing && (
                    <div className="mt-2">
                      <Input
                        placeholder="Expert note (why you're changing this score)"
                        value={edits[p.no]?.expert_note ?? ""}
                        onChange={(e) =>
                          setEdits((cur) => ({
                            ...cur,
                            [p.no]: { score: cur[p.no]?.score ?? p.score, expert_note: e.target.value },
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              ))}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Summary</div>
              <div className="text-sm whitespace-pre-wrap">{result.summary}</div>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Strengths</div>
              <ul className="list-disc pl-4 text-sm space-y-1">
                {result.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div className="rounded border p-3">
              <div className="text-xs font-semibold uppercase text-muted-foreground mb-1">Improvements</div>
              <ul className="list-disc pl-4 text-sm space-y-1">
                {result.improvements.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          {editing && (
            <div className="flex items-center justify-between gap-3 border-t pt-3">
              <p className="text-[11px] text-muted-foreground">
                Note: Once saved, the audit cannot be edited again — unless a coach challenges it (one-time re-edit).
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveEdits} disabled={saving}>
                  {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save audit"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
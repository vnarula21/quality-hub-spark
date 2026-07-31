import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RagBadge } from "@/components/app/RagBadge";
import { Loader2, Eye, Send } from "lucide-react";
import { toast } from "sonner";

const ragOf = (total: number, max: number): "red" | "amber" | "green" => {
  const p = max > 0 ? total / max : 0;
  if (p >= 0.8) return "green";
  if (p >= 0.5) return "amber";
  return "red";
};

export function ManagerAuditReview({ auditId }: { auditId: string }) {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [newFeedback, setNewFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["manager-audit-review", auditId],
    enabled: open,
    queryFn: async () => {
      const [{ data: audit }, { data: auditScores }, { data: feedback }] = await Promise.all([
        supabase
          .from("audits")
          .select(
            "*,coaches!audits_coach_id_fkey(profiles!coaches_profile_id_fkey(full_name)),experts!audits_expert_id_fkey(profiles!experts_profile_id_fkey(full_name)),audit_frameworks(name,kind)",
          )
          .eq("id", auditId)
          .single(),
        supabase.from("audit_scores").select("*").eq("audit_id", auditId).order("criterion_no"),
        supabase.from("audit_feedback").select("*").eq("audit_id", auditId).order("created_at"),
      ]);
      const authorIds = Array.from(new Set((feedback ?? []).map((f) => f.author_id)));
      const { data: authorProfiles } =
        authorIds.length > 0
          ? await supabase.from("profiles").select("id,full_name").in("id", authorIds)
          : { data: [] as { id: string; full_name: string }[] };
      const nameById = new Map((authorProfiles ?? []).map((p) => [p.id, p.full_name]));
      const feedbackWithNames = (feedback ?? []).map((f) => ({ ...f, author_name: nameById.get(f.author_id) ?? "Someone" }));
      return { audit, auditScores: auditScores ?? [], feedback: feedbackWithNames };
    },
  });

  function startReview() {
    if (!data) return;
    const map: Record<string, number> = {};
    for (const s of data.auditScores) map[s.id] = s.score;
    setScores(map);
    setOpen(true);
  }

  async function handleSaveScores() {
    if (!data) return;
    setSaving(true);
    try {
      for (const s of data.auditScores) {
        const newScore = scores[s.id] ?? s.score;
        if (newScore !== s.score) {
          const { error } = await supabase.from("audit_scores").update({ score: newScore }).eq("id", s.id);
          if (error) throw new Error(error.message);
        }
      }
      const total = data.auditScores.reduce((sum, s) => sum + (scores[s.id] ?? s.score), 0);
      const max = data.auditScores.reduce((sum, s) => sum + s.max_score, 0);
      const rag = ragOf(total, max);
      const { error: aErr } = await supabase
        .from("audits")
        .update({ total_score: total, max_score: max, rag })
        .eq("id", auditId);
      if (aErr) throw new Error(aErr.message);
      toast.success("Scores updated");
      qc.invalidateQueries({ queryKey: ["manager-audit-review", auditId] });
      qc.invalidateQueries({ queryKey: ["admin-audits"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not save scores");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddFeedback() {
    if (!newFeedback.trim() || !me?.user) return;
    const { error } = await supabase.from("audit_feedback").insert({
      audit_id: auditId,
      author_id: me.user.id,
      feedback_type: "manager_review",
      content: newFeedback.trim(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Feedback added");
      setNewFeedback("");
      qc.invalidateQueries({ queryKey: ["manager-audit-review", auditId] });
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      const { error } = await supabase
        .from("audits")
        .update({ status: "published", locked: true, published_at: new Date().toISOString() })
        .eq("id", auditId);
      if (error) throw new Error(error.message);
      toast.success("Audit published — the coach can now see it");
      qc.invalidateQueries({ queryKey: ["manager-audit-review", auditId] });
      qc.invalidateQueries({ queryKey: ["admin-audits"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not publish");
    } finally {
      setPublishing(false);
    }
  }

  const audit = data?.audit as any;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) startReview(); }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Eye className="mr-2 h-4 w-4" />Review</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{audit?.title ?? "Audit"}</DialogTitle>
        </DialogHeader>

        {isLoading || !data ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="outline">{audit.coaches?.profiles?.full_name ?? "—"}</Badge>
              <span className="text-muted-foreground">audited by</span>
              <Badge variant="outline">{audit.experts?.profiles?.full_name ?? "—"}</Badge>
              <Badge variant="secondary" className="capitalize">{audit.status.replace(/_/g, " ")}</Badge>
              <RagBadge rag={audit.rag} />
              {audit.zero_tolerance_hit && (
                <Badge className="border bg-rose-500/15 text-rose-700 border-rose-500/30">Zero-tolerance hit</Badge>
              )}
            </div>

            <div className="space-y-2">
              {data.auditScores.map((s: any) => (
                <div key={s.id} className="rounded border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="font-medium text-sm">{s.criterion}</div>
                    <Select
                      value={String(scores[s.id] ?? s.score)}
                      onValueChange={(v) => setScores((cur) => ({ ...cur, [s.id]: Number(v) }))}
                    >
                      <SelectTrigger className="w-20"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: s.max_score + 1 }, (_, n) => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {s.reasoning && <div className="mt-1 text-xs text-muted-foreground">{s.reasoning}</div>}
                  {s.evidence_quote && (
                    <div className="mt-2 rounded bg-secondary/40 px-2 py-1 text-[11px] italic">"{s.evidence_quote}"</div>
                  )}
                  {s.expert_note && (
                    <div className="mt-2 text-[11px] text-muted-foreground">Expert note: {s.expert_note}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={handleSaveScores} disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save score changes"}
              </Button>
            </div>

            <div className="border-t pt-3 space-y-2">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Feedback</div>
              {data.feedback.map((f: any) => (
                <div key={f.id} className="rounded border bg-background p-2 text-sm">
                  <div className="text-[11px] text-muted-foreground mb-1">
                    {f.author_name} · {new Date(f.created_at).toLocaleDateString()}
                  </div>
                  {f.content}
                </div>
              ))}
              <Textarea
                placeholder="Add a review note for the expert/coach…"
                value={newFeedback}
                onChange={(e) => setNewFeedback(e.target.value)}
                rows={2}
              />
              <div className="flex justify-end">
                <Button size="sm" variant="outline" onClick={handleAddFeedback} disabled={!newFeedback.trim()}>
                  Add feedback
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
          {audit && audit.status !== "published" && audit.status !== "closed" && (
            <Button onClick={handlePublish} disabled={publishing}>
              {publishing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing…</> : <><Send className="mr-2 h-4 w-4" />Publish to coach</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

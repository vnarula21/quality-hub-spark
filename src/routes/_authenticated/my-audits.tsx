import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { RagBadge } from "@/components/app/RagBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { coachChallengeAudit } from "@/lib/qip/audit.functions";

export const Route = createFileRoute("/_authenticated/my-audits")({
  component: MyAudits,
});

function MyAudits() {
  const { data: me } = useMe();
  const coachId = me?.coachId;
  const challenge = useServerFn(coachChallengeAudit);
  const { data: audits, refetch } = useQuery({
    queryKey: ["my-audits", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data } = await supabase.from("audits").select("*").eq("coach_id", coachId!).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function handleChallenge(auditId: string) {
    try {
      await challenge({ data: { audit_id: auditId } });
      toast.success("Challenge raised — the auditor can now re-review and re-edit this audit.");
      refetch();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not raise a challenge");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="My Audits" description="Audits assigned to you. Accept results or raise an objection." />
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Title</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">RAG</th>
              <th className="px-4 py-3 text-left">Score</th>
              <th className="px-4 py-3 text-left">Conducted</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(audits ?? []).map((a: any) => (
              <tr key={a.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{a.status.replace(/_/g, " ")}</Badge></td>
                <td className="px-4 py-3"><RagBadge rag={a.rag} /></td>
                <td className="px-4 py-3">{Number(a.total_score ?? 0).toFixed(0)}/{a.max_score}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.conducted_at ? new Date(a.conducted_at).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-3 text-right space-x-2">
                  {a.status === "published" && !a.accepted_by_coach && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      const { error } = await supabase.from("audits").update({ accepted_by_coach: true }).eq("id", a.id);
                      if (error) toast.error(error.message); else { toast.success("Audit accepted"); refetch(); }
                    }}>Accept</Button>
                  )}
                  {a.status === "published" && !a.accepted_by_coach && a.locked && (a.challenge_count ?? 0) < 1 && (
                    <Button size="sm" variant="ghost" onClick={() => handleChallenge(a.id)}>Challenge</Button>
                  )}
                  {a.accepted_by_coach && <span className="text-xs text-success">Accepted</span>}
                  {(a.challenge_count ?? 0) >= 1 && !a.accepted_by_coach && (
                    <span className="text-xs text-muted-foreground">Challenged — pending re-review</span>
                  )}
                </td>
              </tr>
            ))}
            {(!audits || audits.length === 0) && <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>No audits yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

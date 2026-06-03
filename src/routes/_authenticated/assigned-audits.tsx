import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { RagBadge } from "@/components/app/RagBadge";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/assigned-audits")({ component: AssignedAudits });

function AssignedAudits() {
  const { data: me } = useMe();
  const expertId = me?.expertId;
  const { data } = useQuery({
    queryKey: ["assigned", expertId],
    enabled: !!expertId,
    queryFn: async () => {
      const { data } = await supabase
        .from("audits")
        .select("*,coaches!audits_coach_id_fkey(profiles!coaches_profile_id_fkey(full_name))")
        .eq("expert_id", expertId!)
        .neq("status", "published")
        .order("scheduled_at", { ascending: true });
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Assigned Audits" description="Audits that need your attention." />
      <AuditTable rows={data ?? []} />
    </div>
  );
}

export function AuditTable({ rows }: { rows: any[] }) {
  return (
    <div className="surface-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Title</th>
            <th className="px-4 py-3 text-left">Coach</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">RAG</th>
            <th className="px-4 py-3 text-left">Score</th>
            <th className="px-4 py-3 text-left">Scheduled</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((a: any) => (
            <tr key={a.id} className="hover:bg-secondary/40">
              <td className="px-4 py-3 font-medium">{a.title}</td>
              <td className="px-4 py-3">{a.coaches?.profiles?.full_name ?? "—"}</td>
              <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{a.status.replace(/_/g, " ")}</Badge></td>
              <td className="px-4 py-3"><RagBadge rag={a.rag} /></td>
              <td className="px-4 py-3">{Number(a.total_score ?? 0).toFixed(0)}/{a.max_score}</td>
              <td className="px-4 py-3 text-muted-foreground">{a.scheduled_at ? new Date(a.scheduled_at).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>No audits.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

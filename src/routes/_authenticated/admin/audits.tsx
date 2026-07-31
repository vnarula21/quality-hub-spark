import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { RagBadge } from "@/components/app/RagBadge";
import { Badge } from "@/components/ui/badge";
import { ManagerAuditReview } from "@/components/audit/ManagerAuditReview";

export const Route = createFileRoute("/_authenticated/admin/audits")({ component: AdminAudits });

function AdminAudits() {
  const { data } = useQuery({
    queryKey: ["admin-audits"],
    queryFn: async () => {
      const { data } = await supabase
        .from("audits")
        .select("*,coaches!audits_coach_id_fkey(profiles!coaches_profile_id_fkey(full_name)),experts!audits_expert_id_fkey(profiles!experts_profile_id_fkey(full_name))")
        .order("created_at", { ascending: false }).limit(100);
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Audits" description="All audits across the organization." />
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3 text-left">Title</th><th className="px-4 py-3 text-left">Coach</th><th className="px-4 py-3 text-left">Expert</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">RAG</th><th className="px-4 py-3 text-left">Score</th><th className="px-4 py-3 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((a: any) => (
              <tr key={a.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium">{a.title}</td>
                <td className="px-4 py-3">{a.coaches?.profiles?.full_name ?? "—"}</td>
                <td className="px-4 py-3">{a.experts?.profiles?.full_name ?? "—"}</td>
                <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{a.status.replace(/_/g, " ")}</Badge></td>
                <td className="px-4 py-3"><RagBadge rag={a.rag} /></td>
                <td className="px-4 py-3">{Number(a.total_score ?? 0).toFixed(0)}/{a.max_score}</td>
                <td className="px-4 py-3 text-right"><ManagerAuditReview auditId={a.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

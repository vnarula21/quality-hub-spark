import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { RagBadge } from "@/components/app/RagBadge";

export const Route = createFileRoute("/_authenticated/admin/coaches")({ component: Page });

function Page() {
  const { data } = useQuery({
    queryKey: ["admin-coaches"],
    queryFn: async () =>
      (
        await supabase
          .from("coaches")
          .select("*,profiles!coaches_profile_id_fkey(full_name,email,employee_code),teams(name),experts!coaches_assigned_expert_id_fkey(profiles!experts_profile_id_fkey(full_name))")
          .order("cpi", { ascending: false })
      ).data ?? [],
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Coaches" description={`All coaches in the platform (${data?.length ?? 0}).`} />
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">#</th>
              <th className="px-4 py-3 text-left">Coach</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-4 py-3 text-left">CPI</th>
              <th className="px-4 py-3 text-left">Quality</th>
              <th className="px-4 py-3 text-left">Rating</th>
              <th className="px-4 py-3 text-left">RAG</th>
              <th className="px-4 py-3 text-left">Assigned Auditor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((c: any, i) => (
              <tr key={c.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3 font-medium">
                  {c.profiles?.full_name}
                  <div className="text-xs text-muted-foreground">{c.profiles?.employee_code}</div>
                </td>
                <td className="px-4 py-3">{c.teams?.name ?? "—"}</td>
                <td className="px-4 py-3">{Number(c.cpi).toFixed(1)}</td>
                <td className="px-4 py-3">{Number(c.current_quality_score).toFixed(1)}</td>
                <td className="px-4 py-3">{Number(c.current_rating).toFixed(2)}★</td>
                <td className="px-4 py-3"><RagBadge rag={c.current_rag} /></td>
                <td className="px-4 py-3 text-muted-foreground">{c.experts?.profiles?.full_name ?? "Unassigned"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

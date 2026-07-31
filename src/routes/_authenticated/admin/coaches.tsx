import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { RagBadge } from "@/components/app/RagBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/coaches")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-coaches"],
    queryFn: async () =>
      (
        await supabase
          .from("coaches")
          .select("*,profiles!coaches_profile_id_fkey(full_name,email,employee_code),teams(name)")
          .order("cpi", { ascending: false })
      ).data ?? [],
  });

  const { data: experts } = useQuery({
    queryKey: ["admin-experts-list"],
    queryFn: async () =>
      (
        await supabase
          .from("experts")
          .select("id,profiles!experts_profile_id_fkey(full_name)")
          .order("id")
      ).data ?? [],
  });

  const assignExpert = async (coachId: string, expertId: string | null) => {
    const { error } = await supabase.from("coaches").update({ assigned_expert_id: expertId }).eq("id", coachId);
    if (error) toast.error(error.message);
    else {
      toast.success(expertId ? "Expert assigned" : "Expert unassigned");
      qc.invalidateQueries({ queryKey: ["admin-coaches"] });
    }
  };

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
              <th className="px-4 py-3 text-left">Assigned Expert (Auditor)</th>
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
                <td className="px-4 py-3">
                  <Select
                    value={c.assigned_expert_id ?? "none"}
                    onValueChange={(v) => assignExpert(c.id, v === "none" ? null : v)}
                  >
                    <SelectTrigger className="h-8 w-48"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {(experts ?? []).map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.profiles?.full_name ?? "Unnamed expert"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

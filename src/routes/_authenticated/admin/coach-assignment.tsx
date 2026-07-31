import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/coach-assignment")({ component: Page });

function Page() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["coach-assignment-list"],
    queryFn: async () =>
      (
        await supabase
          .from("coaches")
          .select("id,assigned_expert_id,profiles!coaches_profile_id_fkey(full_name,employee_code),teams(name)")
          .order("id")
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
      toast.success(expertId ? "Auditor assigned" : "Auditor unassigned");
      qc.invalidateQueries({ queryKey: ["coach-assignment-list"] });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coach → Auditor Assignment"
        description="Each coach is assigned to exactly one auditor, who is the only one who can audit their calls/chats."
      />
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Coach</th>
              <th className="px-4 py-3 text-left">Team</th>
              <th className="px-4 py-3 text-left">Assigned Auditor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((c: any) => (
              <tr key={c.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium">
                  {c.profiles?.full_name}
                  <div className="text-xs text-muted-foreground">{c.profiles?.employee_code}</div>
                </td>
                <td className="px-4 py-3">{c.teams?.name ?? "—"}</td>
                <td className="px-4 py-3">
                  <Select
                    value={c.assigned_expert_id ?? "none"}
                    onValueChange={(v) => assignExpert(c.id, v === "none" ? null : v)}
                  >
                    <SelectTrigger className="h-8 w-56"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {(experts ?? []).map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.profiles?.full_name ?? "Unnamed auditor"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {(!data || data.length === 0) && (
              <tr><td className="px-4 py-8 text-center text-muted-foreground" colSpan={3}>No coaches yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

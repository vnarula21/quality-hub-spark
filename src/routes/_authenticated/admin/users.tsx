import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useMe } from "@/lib/qip/auth";
import type { AppRole } from "@/lib/qip/types";
import { ROLE_LABEL } from "@/lib/qip/types";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: Users });

function Users() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["all-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("*");
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role) as AppRole[],
      }));
    },
  });

  const assign = async (userId: string, role: AppRole) => {
    // remove existing roles then insert new (admin/super_admin only)
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error(error.message);
    else { toast.success("Role updated"); qc.invalidateQueries({ queryKey: ["all-users"] }); }
  };

  const setStatus = async (userId: string, status: "active" | "inactive") => {
    const { error } = await supabase.from("profiles").update({ status, deactivated_at: status === "inactive" ? new Date().toISOString() : null }).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["all-users"] }); }
  };

  if (!me) return null;

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Create, deactivate and assign roles across the platform." />
      <div className="surface-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Roles</th><th className="px-4 py-3 text-left">Assign role</th><th className="px-4 py-3 text-right">Action</th></tr>
          </thead>
          <tbody className="divide-y">
            {(data ?? []).map((u: any) => (
              <tr key={u.id} className="hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <div className="font-medium">{u.full_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{u.email}</div>
                </td>
                <td className="px-4 py-3"><Badge variant={u.status === "active" ? "default" : "outline"}>{u.status}</Badge></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                    {u.roles.map((r: AppRole) => <Badge key={r} variant="secondary">{ROLE_LABEL[r]}</Badge>)}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Select onValueChange={(v) => assign(u.id, v as AppRole)}>
                    <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Set role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Quality Manager</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                      <SelectItem value="coach">Coach</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3 text-right">
                  {u.status === "active" ? (
                    <Button size="sm" variant="outline" onClick={() => setStatus(u.id, "inactive")} disabled={u.id === me.user.id}>Deactivate</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setStatus(u.id, "active")}>Reactivate</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

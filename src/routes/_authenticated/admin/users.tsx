import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMe } from "@/lib/qip/auth";
import type { AppRole } from "@/lib/qip/types";
import { ROLE_LABEL } from "@/lib/qip/types";
import { createUser } from "@/lib/qip/users.functions";
import { Loader2, UserPlus, Copy } from "lucide-react";

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
    if (error) { toast.error(error.message); return; }

    // Make sure the matching coaches/experts row exists too - without this,
    // a user tagged as coach/expert won't show up anywhere in the app.
    if (role === "coach") {
      const { data: existing } = await supabase.from("coaches").select("id").eq("profile_id", userId).maybeSingle();
      if (!existing) {
        const { error: cErr } = await supabase.from("coaches").insert({ profile_id: userId });
        if (cErr) toast.error(`Role set, but couldn't create coach record: ${cErr.message}`);
      }
    } else if (role === "expert") {
      const { data: existing } = await supabase.from("experts").select("id").eq("profile_id", userId).maybeSingle();
      if (!existing) {
        const { error: eErr } = await supabase.from("experts").insert({ profile_id: userId });
        if (eErr) toast.error(`Role set, but couldn't create expert record: ${eErr.message}`);
      }
    }
    toast.success("Role updated");
    qc.invalidateQueries({ queryKey: ["all-users"] });
  };

  const setStatus = async (userId: string, status: "active" | "inactive") => {
    const { error } = await supabase.from("profiles").update({ status, deactivated_at: status === "inactive" ? new Date().toISOString() : null }).eq("id", userId);
    if (error) toast.error(error.message);
    else { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["all-users"] }); }
  };

  if (!me) return null;
  const isSuperAdmin = me.primaryRole === "super_admin";

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Users" description="Create, deactivate and assign roles across the platform." />
        {isSuperAdmin && <CreateUserDialog onCreated={() => qc.invalidateQueries({ queryKey: ["all-users"] })} />}
      </div>
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
                      <SelectItem value="admin">Manager</SelectItem>
                      <SelectItem value="expert">Auditor</SelectItem>
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

function CreateUserDialog({ onCreated }: { onCreated: () => void }) {
  const create = useServerFn(createUser);
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AppRole>("coach");
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ email: string; temp_password: string } | null>(null);

  async function handleCreate() {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Full name and email are required");
      return;
    }
    setCreating(true);
    try {
      const res = await create({ data: { full_name: fullName.trim(), email: email.trim(), role } });
      setResult({ email: res.email, temp_password: res.temp_password });
      setFullName("");
      setEmail("");
      setRole("coach");
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not create user");
    } finally {
      setCreating(false);
    }
  }

  function handleClose(v: boolean) {
    setOpen(v);
    if (!v) setResult(null);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button size="sm"><UserPlus className="mr-2 h-4 w-4" />Create user</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Create user</DialogTitle></DialogHeader>

        {result ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              User created. Share this one-time password with them — they can change it after logging in.
            </p>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input readOnly value={result.email} />
              <Label>Temporary password</Label>
              <div className="flex gap-2">
                <Input readOnly value={result.temp_password} />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => { navigator.clipboard.writeText(result.temp_password); toast.success("Copied"); }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jordan Smith" />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jordan@company.com" />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="coach">Coach</SelectItem>
                  <SelectItem value="expert">Auditor</SelectItem>
                  <SelectItem value="admin">Manager</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <DialogFooter>
          {result ? (
            <Button onClick={() => handleClose(false)}>Done</Button>
          ) : (
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : "Create user"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

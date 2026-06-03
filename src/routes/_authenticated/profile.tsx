import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ROLE_LABEL } from "@/lib/qip/types";

export const Route = createFileRoute("/_authenticated/profile")({ component: Profile });

function Profile() {
  const { data: me, refetch } = useMe();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [pw, setPw] = useState("");
  useEffect(() => {
    if (me?.profile) {
      setFullName(me.profile.full_name ?? "");
      setPhone((me.profile as any).phone ?? "");
    }
  }, [me?.profile]);
  if (!me) return null;
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Profile" description="Manage your account details and password." />
      <div className="surface-card p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground text-xl font-bold">
            {(me.profile?.full_name || me.user.email || "U").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-semibold">{me.profile?.full_name}</div>
            <div className="text-sm text-muted-foreground">{me.user.email}</div>
            <div className="mt-1 flex gap-1.5">
              {me.roles.map((r) => <Badge key={r} variant="secondary">{ROLE_LABEL[r]}</Badge>)}
            </div>
          </div>
        </div>
        <form
          className="grid gap-4 md:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", me.user.id);
            if (error) toast.error(error.message);
            else { toast.success("Profile updated"); refetch(); }
          }}
        >
          <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
          <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <div className="space-y-2"><Label>Employee code</Label><Input value={me.profile?.employee_code ?? ""} disabled /></div>
          <div className="space-y-2"><Label>Status</Label><Input value={me.profile?.status ?? ""} disabled /></div>
          <div className="md:col-span-2"><Button type="submit">Save profile</Button></div>
        </form>
      </div>
      <div className="surface-card p-6">
        <div className="text-base font-semibold">Change password</div>
        <form
          className="mt-3 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase.auth.updateUser({ password: pw });
            if (error) toast.error(error.message); else { toast.success("Password updated"); setPw(""); }
          }}
        >
          <Input type="password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 8)" required />
          <Button type="submit">Update</Button>
        </form>
      </div>
    </div>
  );
}

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import type { MeData } from "@/lib/qip/auth";
import { PageHeader } from "../AppShell";
import { KpiCard } from "../KpiCard";
import { Users, Shield, Activity, Database, Sparkles, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resetAndSeed, wipeData, promoteSelfToSuperAdmin } from "@/lib/qip/seed.functions";
import { toast } from "sonner";
import { useState } from "react";
import { AdminDashboard } from "./AdminDashboard";

export function SuperAdminDashboard({ me }: { me: MeData }) {
  const qc = useQueryClient();
  const seed = useServerFn(resetAndSeed);
  const wipe = useServerFn(wipeData);
  const promote = useServerFn(promoteSelfToSuperAdmin);
  const [busy, setBusy] = useState<string | null>(null);

  const { data: counts } = useQuery({
    queryKey: ["sa-counts"],
    queryFn: async () => {
      const [u, r, t, p] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true }),
        supabase.from("teams").select("*", { count: "exact", head: true }),
        supabase.from("processes").select("*", { count: "exact", head: true }),
      ]);
      return { users: u.count ?? 0, roles: r.count ?? 0, teams: t.count ?? 0, processes: p.count ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Platform Control" description="Govern users, processes and seed the demo environment." action={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy === "promote"} onClick={async () => {
            setBusy("promote");
            try { await promote(); toast.success("Promoted to Super Admin"); qc.invalidateQueries(); }
            catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
          }}>
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Ensure Super Admin
          </Button>
          <Button variant="outline" size="sm" disabled={busy === "wipe"} onClick={async () => {
            setBusy("wipe");
            try { await wipe(); toast.success("Demo data cleared"); qc.invalidateQueries(); }
            catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
          }}>
            <Trash2 className="mr-1.5 h-4 w-4" /> Wipe data
          </Button>
          <Button size="sm" disabled={busy === "seed"} onClick={async () => {
            setBusy("seed");
            try { const r = await seed(); toast.success(`Seeded ${(r as any).coaches ?? ""} coaches`); qc.invalidateQueries(); }
            catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
          }}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Reset & seed demo
          </Button>
        </div>
      } />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total Users" value={counts?.users ?? 0} icon={Users} tone="primary" />
        <KpiCard label="Role Assignments" value={counts?.roles ?? 0} icon={Shield} />
        <KpiCard label="Teams" value={counts?.teams ?? 0} icon={Activity} />
        <KpiCard label="Processes" value={counts?.processes ?? 0} icon={Database} tone="success" />
      </div>
      <AdminDashboard me={me} />
    </div>
  );
}

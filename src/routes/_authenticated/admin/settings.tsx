import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2, ShieldCheck } from "lucide-react";
import { resetAndSeed, wipeData, promoteSelfToSuperAdmin } from "@/lib/qip/seed.functions";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Settings });

function Settings() {
  const qc = useQueryClient();
  const seed = useServerFn(resetAndSeed);
  const wipe = useServerFn(wipeData);
  const promote = useServerFn(promoteSelfToSuperAdmin);
  const [busy, setBusy] = useState<string | null>(null);
  const run = (k: string, fn: () => Promise<any>, ok: string) => async () => {
    setBusy(k);
    try { await fn(); toast.success(ok); qc.invalidateQueries(); }
    catch (e: any) { toast.error(e.message ?? String(e)); }
    finally { setBusy(null); }
  };
  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="System Settings" description="Platform configuration and demo data tools." />
      <div className="surface-card p-6 space-y-4">
        <div>
          <div className="text-base font-semibold">Super Admin</div>
          <p className="mt-1 text-xs text-muted-foreground">If no Super Admin exists yet, the first signed-in user can take the role to start configuring the platform.</p>
          <Button variant="outline" className="mt-3" disabled={busy === "promote"} onClick={run("promote", () => promote(), "Promoted to Super Admin")}>
            <ShieldCheck className="mr-1.5 h-4 w-4" /> Ensure Super Admin
          </Button>
        </div>
      </div>
      <div className="surface-card p-6 space-y-4">
        <div>
          <div className="text-base font-semibold">Demo data</div>
          <p className="mt-1 text-xs text-muted-foreground">Reset domain data and seed realistic coaches, audits, ratings, RAG and achievements.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy === "seed"} onClick={run("seed", () => seed(), "Demo data seeded")}><Sparkles className="mr-1.5 h-4 w-4" /> Reset & seed demo</Button>
          <Button variant="outline" disabled={busy === "wipe"} onClick={run("wipe", () => wipe(), "Demo data wiped")}><Trash2 className="mr-1.5 h-4 w-4" /> Wipe data</Button>
        </div>
      </div>
    </div>
  );
}

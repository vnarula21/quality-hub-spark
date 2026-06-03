import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Sparkles, Trash2, ShieldCheck, Copy } from "lucide-react";
import { resetAndSeed, wipeData, promoteSelfToSuperAdmin } from "@/lib/qip/seed.functions";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: Settings });

type Credential = { label: string; role: string; email: string; password: string };

function Settings() {
  const qc = useQueryClient();
  const seed = useServerFn(resetAndSeed);
  const wipe = useServerFn(wipeData);
  const promote = useServerFn(promoteSelfToSuperAdmin);
  const [busy, setBusy] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<Credential[] | null>(null);
  const run = (k: string, fn: () => Promise<any>, ok: string, onResult?: (r: any) => void) => async () => {
    setBusy(k);
    try { const r = await fn(); toast.success(ok); onResult?.(r); qc.invalidateQueries(); }
    catch (e: any) { toast.error(e.message ?? String(e)); }
    finally { setBusy(null); }
  };
  const onSeed = run("seed", () => seed(), "Demo data seeded", (r) => {
    if (r?.credentials) setCredentials(r.credentials);
  });
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
          <p className="mt-1 text-xs text-muted-foreground">Wipes domain data and the 4 sample accounts ({" "}<code className="text-[10px]">@qip.test</code>{" "}/{" "}<code className="text-[10px]">@qip.demo</code>{" "}), then re-seeds realistic coaches, audits, ratings, RAG and achievements — plus four real login accounts (one per role).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy === "seed"} onClick={onSeed}><Sparkles className="mr-1.5 h-4 w-4" /> Reset & seed demo</Button>
          <Button variant="outline" disabled={busy === "wipe"} onClick={run("wipe", () => wipe(), "Demo data wiped")}><Trash2 className="mr-1.5 h-4 w-4" /> Wipe data</Button>
        </div>
        {credentials && <CredentialsCard credentials={credentials} />}
      </div>
    </div>
  );
}

export function CredentialsCard({ credentials }: { credentials: Credential[] }) {
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Copied"),
      () => toast.error("Copy failed")
    );
  };
  return (
    <div className="mt-2 rounded-lg border border-warning/30 bg-warning/5 p-4">
      <div className="text-sm font-semibold">Sample credentials</div>
      <p className="mt-1 text-xs text-muted-foreground">Demo only — do not use in production. Share with testers freely.</p>
      <div className="mt-3 divide-y divide-border/60">
        {credentials.map((c) => (
          <div key={c.email} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <div className="font-medium">{c.label}</div>
              <div className="text-xs text-muted-foreground truncate font-mono">{c.email} · {c.password}</div>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => copy(c.email)} title="Copy email"><Copy className="h-3.5 w-3.5" /></Button>
              <Button size="sm" variant="ghost" onClick={() => copy(c.password)} title="Copy password"><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

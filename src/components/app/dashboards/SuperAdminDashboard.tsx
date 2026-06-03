import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import type { MeData } from "@/lib/qip/auth";
import { Sparkles, Trash2, ShieldCheck } from "lucide-react";
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

  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-10 flex flex-wrap gap-2 md:right-6 md:top-6">
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
      <AdminDashboard me={me} />
    </div>
  );
}

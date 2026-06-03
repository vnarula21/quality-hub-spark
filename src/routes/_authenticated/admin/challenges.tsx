import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/challenges")({ component: Page });

function Page() {
  const { data: ch } = useQuery({
    queryKey: ["all-challenges"],
    queryFn: async () => (await supabase.from("challenges").select("*,audits(title)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: obj } = useQuery({
    queryKey: ["all-objections"],
    queryFn: async () => (await supabase.from("coach_objections").select("*,audits(title),coaches!coach_objections_coach_id_fkey(profiles!coaches_profile_id_fkey(full_name))").order("created_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Challenges & Objections" description="Disputes raised by experts and coaches." />
      <div className="surface-card p-5">
        <div className="mb-3 text-sm font-semibold">Expert challenges</div>
        <div className="divide-y">
          {(ch ?? []).map((c: any) => (
            <div key={c.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{c.audits?.title ?? "—"}</div>
                <Badge variant="outline" className="capitalize">{c.status}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{c.reason}</div>
            </div>
          ))}
          {(!ch || ch.length === 0) && <div className="py-6 text-center text-xs text-muted-foreground">No challenges.</div>}
        </div>
      </div>
      <div className="surface-card p-5">
        <div className="mb-3 text-sm font-semibold">Coach objections</div>
        <div className="divide-y">
          {(obj ?? []).map((o: any) => (
            <div key={o.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{o.coaches?.profiles?.full_name} — {o.audits?.title}</div>
                <Badge variant="outline" className="capitalize">{o.status}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{o.content}</div>
            </div>
          ))}
          {(!obj || obj.length === 0) && <div className="py-6 text-center text-xs text-muted-foreground">No objections.</div>}
        </div>
      </div>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/achievements")({ component: Achievements });

function Achievements() {
  const { data: me } = useMe();
  const coachId = me?.coachId;
  const { data } = useQuery({
    queryKey: ["achievements", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data } = await supabase.from("achievements").select("*").eq("coach_id", coachId!).order("earned_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Achievements" description="Your badges, milestones and recognition history." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((a) => (
          <div key={a.id} className="surface-card p-5 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elegant)] transition">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-[image:var(--gradient-accent)] text-primary-foreground shadow-[var(--shadow-elegant)]">
              <Trophy className="h-5 w-5" />
            </div>
            <div className="mt-3 text-base font-semibold">{a.title}</div>
            <div className="mt-1 text-xs text-muted-foreground">{a.description}</div>
            <div className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">Earned {new Date(a.earned_at).toLocaleDateString()}</div>
          </div>
        ))}
        {(!data || data.length === 0) && <div className="surface-card p-8 text-sm text-muted-foreground">No achievements yet — keep going!</div>}
      </div>
    </div>
  );
}

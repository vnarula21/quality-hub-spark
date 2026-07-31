import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-success-stories")({ component: Stories });

function Stories() {
  const { data: me } = useMe();
  const coachId = me?.coachId;
  const { data } = useQuery({
    queryKey: ["stories", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data } = await supabase.from("success_stories").select("*").eq("coach_id", coachId!).order("achieved_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="My Success Stories" description="Member transformations and health outcomes you delivered." />
      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((s) => (
          <div key={s.id} className="surface-card p-5">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <div className="text-base font-semibold">{s.title}</div>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{s.member_name} • {new Date(s.achieved_at).toLocaleDateString()}</div>
            <p className="mt-3 text-sm leading-relaxed">{s.description}</p>
            {s.outcomes && <p className="mt-3 rounded-lg border bg-success/10 p-3 text-xs text-success">{s.outcomes}</p>}
          </div>
        ))}
        {(!data || data.length === 0) && <div className="surface-card p-8 text-sm text-muted-foreground">No success stories yet.</div>}
      </div>
    </div>
  );
}

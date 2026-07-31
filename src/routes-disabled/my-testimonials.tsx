import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { Quote } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-testimonials")({ component: MyTestimonials });

function MyTestimonials() {
  const { data: me } = useMe();
  const coachId = me?.coachId;
  const { data } = useQuery({
    queryKey: ["testimonials", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data } = await supabase.from("testimonials").select("*").eq("coach_id", coachId!).order("given_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="My Testimonials" description="Recognition from the members you serve." />
      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((t) => (
          <div key={t.id} className="surface-card p-5">
            <Quote className="h-5 w-5 text-primary/60" />
            <p className="mt-3 text-sm leading-relaxed">{t.content}</p>
            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs font-medium">— {t.member_name}</div>
              {t.rating && <div className="text-xs text-warning">{Number(t.rating).toFixed(1)}★</div>}
            </div>
          </div>
        ))}
        {(!data || data.length === 0) && <div className="surface-card p-8 text-sm text-muted-foreground">No testimonials yet.</div>}
      </div>
    </div>
  );
}

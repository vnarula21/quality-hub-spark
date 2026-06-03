import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-ratings")({ component: MyRatings });

function MyRatings() {
  const { data: me } = useMe();
  const coachId = me?.coachId;
  const { data } = useQuery({
    queryKey: ["ratings", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data } = await supabase.from("ratings").select("*").eq("coach_id", coachId!).order("month", { ascending: false });
      return data ?? [];
    },
  });
  const avg = (data ?? []).length ? (data!.reduce((s, r) => s + Number(r.rating), 0) / data!.length).toFixed(2) : "—";
  return (
    <div className="space-y-6">
      <PageHeader title="My Ratings" description="Monthly member rating history." />
      <div className="surface-card p-5 flex items-center gap-4">
        <Star className="h-8 w-8 text-warning" />
        <div>
          <div className="text-xs uppercase text-muted-foreground tracking-wider">Avg rating</div>
          <div className="text-3xl font-bold">{avg}{avg !== "—" && "★"}</div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((r) => (
          <div key={r.id} className="surface-card p-4">
            <div className="text-xs uppercase text-muted-foreground tracking-wider">{new Date(r.month).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
            <div className="mt-2 flex items-end gap-1.5">
              <span className="text-3xl font-bold">{Number(r.rating).toFixed(2)}</span>
              <span className="text-warning mb-1">★</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">Source: {r.source ?? "member"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

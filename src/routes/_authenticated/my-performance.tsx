import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { KpiCard } from "@/components/app/KpiCard";
import { RagBadge } from "@/components/app/RagBadge";
import { Activity, Star, TrendingUp, Trophy } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/my-performance")({
  component: MyPerformance,
});

function MyPerformance() {
  const { data: me } = useMe();
  const coachId = me?.coachId;
  const { data } = useQuery({
    queryKey: ["perf", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const [{ data: coach }, { data: rag }, { data: ratings }] = await Promise.all([
        supabase.from("coaches").select("*").eq("id", coachId!).maybeSingle(),
        supabase.from("rag_reports").select("*").eq("coach_id", coachId!).order("month"),
        supabase.from("ratings").select("*").eq("coach_id", coachId!).order("month"),
      ]);
      const ml = (m: string) => new Date(m).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
      const merged = (rag ?? []).map((r) => {
        const rt = ratings?.find((x) => x.month === r.month);
        return { month: ml(r.month), score: Number(r.score), rating: rt ? Number(rt.rating) * 20 : null, rag: r.rag };
      });
      return { coach, merged, rag, ratings };
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="My Performance" description="Your monthly KPIs and trends." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Quality Score" value={data?.coach ? Number(data.coach.current_quality_score).toFixed(1) : "—"} icon={Activity} tone="primary" />
        <KpiCard label="Rating" value={data?.coach ? `${Number(data.coach.current_rating).toFixed(2)}★` : "—"} icon={Star} tone="warning" />
        <KpiCard label="CPI" value={data?.coach ? Number(data.coach.cpi).toFixed(1) : "—"} icon={TrendingUp} />
        <KpiCard label="Rank" value={data?.coach?.current_rank ? `#${data.coach.current_rank}` : "—"} icon={Trophy} tone="success" />
      </div>
      <div className="surface-card p-5">
        <div className="text-sm font-semibold">Monthly performance trend</div>
        <div className="text-xs text-muted-foreground">Quality score and rating (rating scaled ×20)</div>
        <div className="h-72 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data?.merged ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" name="Quality" dataKey="score" stroke="var(--color-chart-1)" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" name="Rating ×20" dataKey="rating" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="surface-card p-5">
        <div className="text-sm font-semibold">RAG history</div>
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          {(data?.rag ?? []).map((r: any) => (
            <div key={r.id} className="rounded-lg border bg-secondary/40 p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{new Date(r.month).toLocaleDateString(undefined, { month: "short", year: "numeric" })}</div>
              <div className="mt-1 text-lg font-bold">{Number(r.score).toFixed(0)}</div>
              <div className="mt-1"><RagBadge rag={r.rag} /></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

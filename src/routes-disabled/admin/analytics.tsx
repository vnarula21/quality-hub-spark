import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend } from "recharts";

export const Route = createFileRoute("/_authenticated/admin/analytics")({ component: Analytics });

function Analytics() {
  const { data } = useQuery({
    queryKey: ["org-analytics"],
    queryFn: async () => {
      const { data: rag } = await supabase.from("rag_reports").select("month,score");
      const buckets: Record<string, number[]> = {};
      (rag ?? []).forEach((r: any) => {
        const k = new Date(r.month).toLocaleDateString(undefined, { month: "short", year: "2-digit" });
        (buckets[k] = buckets[k] ?? []).push(Number(r.score));
      });
      const trend = Object.entries(buckets).map(([month, arr]) => ({ month, avg: arr.reduce((s, n) => s + n, 0) / arr.length }));
      return trend;
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Quality trends across the organization." />
      <div className="surface-card p-5">
        <div className="text-sm font-semibold">Org-wide quality trend</div>
        <div className="h-72 mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
              <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
              <Legend />
              <Line type="monotone" name="Avg quality" dataKey="avg" stroke="var(--color-chart-1)" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

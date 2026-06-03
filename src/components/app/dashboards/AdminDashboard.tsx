import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MeData } from "@/lib/qip/auth";
import { PageHeader } from "../AppShell";
import { KpiCard } from "../KpiCard";
import { RagBadge } from "../RagBadge";
import { Users, ClipboardCheck, Activity, Star, Shield, AlertTriangle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";

export function AdminDashboard({ me }: { me: MeData }) {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [coaches, experts, audits, challenges, objections] = await Promise.all([
        supabase.from("coaches").select("current_quality_score,current_rating,current_rag,cpi"),
        supabase.from("experts").select("id", { count: "exact", head: true }),
        supabase.from("audits").select("status"),
        supabase.from("challenges").select("status").eq("status", "open"),
        supabase.from("coach_objections").select("status").eq("status", "open"),
      ]);
      const cs = coaches.data ?? [];
      const avgQ = cs.length ? cs.reduce((s, c) => s + Number(c.current_quality_score ?? 0), 0) / cs.length : 0;
      const avgR = cs.length ? cs.reduce((s, c) => s + Number(c.current_rating ?? 0), 0) / cs.length : 0;
      const ragCount = { red: 0, amber: 0, green: 0 } as Record<string, number>;
      cs.forEach((c: any) => { if (c.current_rag) ragCount[c.current_rag] = (ragCount[c.current_rag] ?? 0) + 1; });
      const pending = (audits.data ?? []).filter((a) => a.status === "pending_review").length;
      const ragLetter = avgQ >= 85 ? "Green" : avgQ >= 72 ? "Amber" : "Red";
      return {
        totalCoaches: cs.length,
        totalExperts: experts.count ?? 0,
        avgQ, avgR, ragLetter, ragCount,
        pendingAudits: pending,
        pendingChallenges: challenges.data?.length ?? 0,
        pendingObjections: objections.data?.length ?? 0,
      };
    },
  });

  const { data: top } = useQuery({
    queryKey: ["admin-top"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coaches")
        .select("id,current_quality_score,current_rating,current_rag,cpi,profiles!coaches_profile_id_fkey(full_name)")
        .order("cpi", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: bottom } = useQuery({
    queryKey: ["admin-bottom"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coaches")
        .select("id,current_quality_score,current_rating,current_rag,cpi,profiles!coaches_profile_id_fkey(full_name)")
        .order("cpi", { ascending: true }).limit(5);
      return data ?? [];
    },
  });

  const ragPie = stats ? [
    { name: "Green", value: stats.ragCount.green, color: "var(--color-rag-green)" },
    { name: "Amber", value: stats.ragCount.amber, color: "var(--color-rag-amber)" },
    { name: "Red", value: stats.ragCount.red, color: "var(--color-rag-red)" },
  ] : [];

  const qualityBars = (top ?? []).map((c: any) => ({
    name: (c.profiles?.full_name ?? "").split(" ")[0],
    quality: Number(c.current_quality_score),
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Operations dashboard" description={`Hello, ${me.profile?.full_name?.split(" ")[0] ?? ""} — your quality command center.`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Total Coaches" value={stats?.totalCoaches ?? "—"} icon={Users} tone="primary" />
        <KpiCard label="Total Experts" value={stats?.totalExperts ?? "—"} icon={Shield} />
        <KpiCard label="Avg Quality Score" value={stats ? stats.avgQ.toFixed(1) : "—"} icon={Activity} tone="success" />
        <KpiCard label="Avg Rating" value={stats ? `${stats.avgR.toFixed(2)}★` : "—"} icon={Star} tone="warning" />
        <KpiCard label="Org RAG" value={stats?.ragLetter ?? "—"} icon={Activity} />
        <KpiCard label="Pending Audits" value={stats?.pendingAudits ?? 0} icon={ClipboardCheck} tone="warning" />
        <KpiCard label="Pending Challenges" value={stats?.pendingChallenges ?? 0} icon={Shield} tone="warning" />
        <KpiCard label="Pending Objections" value={stats?.pendingObjections ?? 0} icon={AlertTriangle} tone="destructive" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="text-sm font-semibold">Top performers — quality score</div>
          <div className="text-xs text-muted-foreground">Ranked by Coach Performance Index</div>
          <div className="h-64 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qualityBars}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Bar dataKey="quality" radius={[8, 8, 0, 0]} fill="var(--color-chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="text-sm font-semibold">RAG distribution</div>
          <div className="text-xs text-muted-foreground">Coaches by health status</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ragPie} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {ragPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <RankList title="Top performing coaches" data={top ?? []} highlight="success" />
        <RankList title="Bottom performing coaches" data={bottom ?? []} highlight="destructive" />
      </div>
    </div>
  );
}

function RankList({ title, data, highlight }: { title: string; data: any[]; highlight: "success" | "destructive" }) {
  return (
    <div className="surface-card p-5">
      <div className="text-sm font-semibold">{title}</div>
      <div className="mt-3 divide-y">
        {data.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 py-2.5">
            <div className={"grid h-8 w-8 place-items-center rounded-lg text-xs font-bold " + (highlight === "success" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive")}>#{i + 1}</div>
            <div className="flex-1 min-w-0">
              <div className="truncate text-sm font-medium">{c.profiles?.full_name ?? "Coach"}</div>
              <div className="text-xs text-muted-foreground">CPI {Number(c.cpi).toFixed(1)} • Quality {Number(c.current_quality_score).toFixed(0)}</div>
            </div>
            <RagBadge rag={c.current_rag} />
          </div>
        ))}
      </div>
    </div>
  );
}

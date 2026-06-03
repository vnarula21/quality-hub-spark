import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MeData } from "@/lib/qip/auth";
import { PageHeader } from "../AppShell";
import { KpiCard } from "../KpiCard";
import { RagBadge } from "../RagBadge";
import { Trophy, Star, Activity, ClipboardCheck, MessageSquare, Sparkles, TrendingUp, BadgeCheck } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from "recharts";

export function CoachDashboard({ me }: { me: MeData }) {
  const coachId = me.coachId;

  const { data: coach } = useQuery({
    queryKey: ["coach-self", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data } = await supabase.from("coaches").select("*").eq("id", coachId!).maybeSingle();
      return data;
    },
  });

  const { data: trend } = useQuery({
    queryKey: ["coach-trend", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const [{ data: ratings }, { data: rag }] = await Promise.all([
        supabase.from("ratings").select("month,rating").eq("coach_id", coachId!).order("month"),
        supabase.from("rag_reports").select("month,score,rag").eq("coach_id", coachId!).order("month"),
      ]);
      const monthLabel = (m: string) => new Date(m).toLocaleDateString(undefined, { month: "short" });
      const merged = (rag ?? []).map((r) => {
        const rt = ratings?.find((x) => x.month === r.month);
        return { month: monthLabel(r.month), score: Number(r.score), rating: rt ? Number(rt.rating) : null };
      });
      return merged;
    },
  });

  const { data: testimonials } = useQuery({
    queryKey: ["coach-testimonials-count", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { count } = await supabase.from("testimonials").select("*", { count: "exact", head: true }).eq("coach_id", coachId!);
      return count ?? 0;
    },
  });

  const { data: stories } = useQuery({
    queryKey: ["coach-stories-count", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { count } = await supabase.from("success_stories").select("*", { count: "exact", head: true }).eq("coach_id", coachId!);
      return count ?? 0;
    },
  });

  const { data: recentAudit } = useQuery({
    queryKey: ["coach-recent-audit", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data } = await supabase
        .from("audits").select("total_score,max_score")
        .eq("coach_id", coachId!).eq("status", "published")
        .order("published_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  const { data: leaderboard } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coaches")
        .select("id,current_rank,current_quality_score,current_rating,current_rag,cpi,profiles!coaches_profile_id_fkey(full_name)")
        .order("cpi", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: achievements } = useQuery({
    queryKey: ["coach-achievements", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data } = await supabase.from("achievements").select("*").eq("coach_id", coachId!).order("earned_at", { ascending: false });
      return data ?? [];
    },
  });

  if (!coachId) {
    return (
      <div>
        <PageHeader title={`Welcome, ${me.profile?.full_name?.split(" ")[0] ?? ""}`} description="Your coach profile hasn't been linked yet — a Quality Manager will set it up." />
        <div className="surface-card p-8 text-sm text-muted-foreground">No coach record found for your account.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${me.profile?.full_name?.split(" ")[0] ?? "Coach"}`} description="Your live performance snapshot — quality, recognition, and impact." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Quality Score" value={coach ? `${Number(coach.current_quality_score).toFixed(1)}` : "—"} icon={Activity} tone="primary" delta="Out of 100" />
        <KpiCard label="Current Rating" value={coach ? `${Number(coach.current_rating).toFixed(2)}★` : "—"} icon={Star} tone="warning" delta="Last 30 days" />
        <KpiCard label="Current Rank" value={coach?.current_rank ? `#${coach.current_rank}` : "—"} icon={Trophy} tone="success" delta="Org-wide" />
        <KpiCard label="Coach Performance Index" value={coach ? Number(coach.cpi).toFixed(1) : "—"} icon={TrendingUp} tone="primary" delta="CPI" />
        <KpiCard label="Monthly Audit Score" value={recentAudit ? `${Number(recentAudit.total_score).toFixed(0)}/${recentAudit.max_score}` : "—"} icon={ClipboardCheck} />
        <KpiCard label="Testimonials" value={testimonials ?? 0} icon={MessageSquare} />
        <KpiCard label="Success Stories" value={stories ?? 0} icon={Sparkles} tone="success" />
        <KpiCard label="RAG Status" value={<RagBadge rag={coach?.current_rag as any} /> as any} icon={BadgeCheck} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <div className="text-sm font-semibold">Quality score trend</div>
              <div className="text-xs text-muted-foreground">Monthly performance over the last 6 months</div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend ?? []}>
                <defs>
                  <linearGradient id="qsGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Area type="monotone" dataKey="score" stroke="var(--color-chart-1)" strokeWidth={2.5} fill="url(#qsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="text-sm font-semibold">Rating trend</div>
          <div className="text-xs text-muted-foreground">Member rating, monthly</div>
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <YAxis domain={[1, 5]} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
                <Tooltip contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 12 }} />
                <Line type="monotone" dataKey="rating" stroke="var(--color-chart-2)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card p-5 lg:col-span-2">
          <div className="text-sm font-semibold">Top coaches — leaderboard</div>
          <div className="text-xs text-muted-foreground">Ranked by Coach Performance Index</div>
          <div className="mt-4 divide-y">
            {(leaderboard ?? []).map((c: any, i: number) => (
              <div key={c.id} className="flex items-center gap-3 py-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary text-xs font-bold">#{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">{c.profiles?.full_name ?? "Coach"}</div>
                  <div className="text-xs text-muted-foreground">CPI {Number(c.cpi).toFixed(1)} • Quality {Number(c.current_quality_score).toFixed(0)}</div>
                </div>
                <RagBadge rag={c.current_rag} />
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="text-sm font-semibold">Achievements</div>
          <div className="text-xs text-muted-foreground">Badges and recognition</div>
          <div className="mt-4 space-y-2">
            {(achievements ?? []).length === 0 && <div className="text-xs text-muted-foreground">No achievements yet.</div>}
            {(achievements ?? []).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-lg border bg-secondary/40 p-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-[image:var(--gradient-accent)] text-primary-foreground">
                  <Trophy className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{a.title}</div>
                  <div className="truncate text-[11px] text-muted-foreground">{a.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

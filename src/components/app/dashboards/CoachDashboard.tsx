import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MeData } from "@/lib/qip/auth";
import { PageHeader } from "../AppShell";
import { Trophy, Star, ClipboardCheck, MessageSquare, Sparkles, TrendingUp, Shield, ArrowUp, ChevronRight, Medal, Award, type LucideIcon } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid } from "recharts";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Rag = "red" | "amber" | "green";
const ragColor: Record<Rag, string> = { green: "bg-emerald-500", amber: "bg-amber-400", red: "bg-rose-500" };
const ragText: Record<Rag, string> = { green: "text-emerald-600", amber: "text-amber-600", red: "text-rose-600" };

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
      const merged = (rag ?? []).slice(-6).map((r) => {
        const rt = ratings?.find((x) => x.month === r.month);
        return { month: monthLabel(r.month), score: Number(r.score), cpi: Math.round(Number(r.score) * 0.96), rating: rt ? Number(rt.rating) : null, rag: r.rag as Rag };
      });
      const last = merged[merged.length - 1];
      const prev = merged[merged.length - 2];
      return {
        series: merged,
        deltaScore: last && prev ? last.score - prev.score : 0,
        deltaCpi: last && prev ? last.cpi - prev.cpi : 0,
        deltaRating: last && prev && last.rating != null && prev.rating != null ? last.rating - prev.rating : 0,
        prevMonthLabel: prev?.month ?? "",
      };
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

  if (!coachId) {
    return (
      <div>
        <PageHeader title={`Welcome, ${me.profile?.full_name?.split(" ")[0] ?? ""}`} description="Your coach profile hasn't been linked yet — a Quality Manager will set it up." />
        <div className="surface-card p-8 text-sm text-muted-foreground">No coach record found for your account.</div>
      </div>
    );
  }

  const firstName = me.profile?.full_name?.split(" ")[0] ?? "Coach";
  const rag = (coach?.current_rag ?? "green") as Rag;
  const quality = coach ? Number(coach.current_quality_score) : 0;
  const cpi = coach ? Number(coach.cpi) : 0;
  const rating = coach ? Number(coach.current_rating) : 0;
  const series = trend?.series ?? [];
  const prevLabel = trend?.prevMonthLabel ?? "prev";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, {firstName}! <span className="inline-block">👋</span></h1>
        <p className="mt-1 text-sm text-slate-500">Here's your performance overview and impact snapshot.</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <HeroTile
          label="Quality Score" value={quality.toFixed(1)} unit="Out of 100"
          icon={Star} iconBg="bg-emerald-500"
          tint="from-emerald-50 to-white"
          delta={trend?.deltaScore ?? 0} deltaLabel={`pts vs ${prevLabel}`}
          spark={series.map((s) => ({ x: s.month, y: s.score }))}
          sparkColor="#10b981"
          footerIcon={Award} footerTitle="Excellent Quality!" footerNote="You're performing above expectations."
          footerTint="bg-emerald-50 text-emerald-700"
        />
        <RagTile rag={rag} series={series} />
        <HeroTile
          label="Coach Performance Index (CPI)" value={cpi.toFixed(1)} unit="Out of 100"
          icon={Trophy} iconBg="bg-indigo-500"
          tint="from-indigo-50 to-white"
          delta={trend?.deltaCpi ?? 0} deltaLabel={`pts vs ${prevLabel}`}
          spark={series.map((s) => ({ x: s.month, y: s.cpi }))}
          sparkColor="#6366f1"
          footerIcon={Trophy} footerTitle="Outstanding!" footerNote="You're in the top 1% of coaches."
          footerTint="bg-indigo-50 text-indigo-700"
        />
        <RatingTile rating={rating} delta={trend?.deltaRating ?? 0} prevLabel={prevLabel} />
      </div>

      {/* Middle row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-1">
          <div className="flex items-baseline justify-between">
            <div className="text-sm font-semibold text-slate-900">Performance Trend <span className="text-xs font-normal text-slate-400">(Last 6 Months)</span></div>
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Quality Score</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-indigo-500" />CPI Score</span>
          </div>
          <div className="h-60 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="cpi" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <Link to="/my-performance" className="mt-2 block text-center text-xs font-medium text-indigo-600 hover:underline">View full performance</Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">RAG Trend <span className="text-xs font-normal text-slate-400">(Last 6 Months)</span></div>
          <div className="mt-6 flex items-end justify-between gap-2">
            {padLeft(series, 6).map((m, i, arr) => {
              const isLast = i === arr.length - 1 && m;
              return (
                <div key={i} className="flex flex-1 flex-col items-center gap-2">
                  <div
                    className={cn(
                      "w-full rounded-xl transition-all",
                      m ? ragColor[m.rag] : "bg-slate-100",
                      isLast ? "h-24 ring-4 ring-offset-2 ring-slate-200" : "h-20",
                    )}
                  />
                  <div className="text-[11px] font-medium text-slate-500">{m?.month ?? "—"}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Green</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Amber</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" />Red</span>
          </div>
          <Link to="/my-performance" className="mt-3 block text-center text-xs font-medium text-indigo-600 hover:underline">View RAG history</Link>
        </div>

        <LeaderboardCard leaderboard={leaderboard ?? []} />
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Quick Actions</div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <QuickAction to="/my-audits" icon={ClipboardCheck} tone="bg-blue-100 text-blue-600" title="View My Audits" subtitle="See your audit history" />
          <QuickAction to="/my-performance" icon={TrendingUp} tone="bg-purple-100 text-purple-600" title="View My Performance" subtitle="Detailed performance analytics" />
          <QuickAction to="/my-ratings" icon={Star} tone="bg-amber-100 text-amber-600" title="View My Ratings" subtitle="See member ratings and feedback" />
          <QuickAction to="/my-testimonials" icon={MessageSquare} tone="bg-emerald-100 text-emerald-600" title="View Testimonials" subtitle="Read member testimonials" />
          <QuickAction to="/my-success-stories" icon={Sparkles} tone="bg-orange-100 text-orange-600" title="View Success Stories" subtitle="See your impact stories" />
          <QuickAction to="/achievements" icon={Award} tone="bg-violet-100 text-violet-600" title="View Achievements" subtitle="Track your badges and milestones" />
        </div>
      </div>
    </div>
  );
}

function padLeft<T>(arr: T[], n: number): (T | null)[] {
  if (arr.length >= n) return arr.slice(-n) as (T | null)[];
  return [...Array(n - arr.length).fill(null), ...arr];
}

function HeroTile({ label, value, unit, icon: Icon, iconBg, tint, delta, deltaLabel, spark, sparkColor, footerIcon: FIcon, footerTitle, footerNote, footerTint }: {
  label: string; value: string; unit: string;
  icon: LucideIcon; iconBg: string; tint: string;
  delta: number; deltaLabel: string;
  spark: { x: string; y: number }[]; sparkColor: string;
  footerIcon: LucideIcon; footerTitle: string; footerNote: string; footerTint: string;
}) {
  const up = delta >= 0;
  return (
    <div className={cn("rounded-2xl border border-slate-200 bg-gradient-to-b p-5 shadow-sm", tint)}>
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</div>
        <div className={cn("grid h-9 w-9 place-items-center rounded-lg text-white", iconBg)}><Icon className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className="text-xs text-slate-500">{unit}</div>
      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium text-emerald-600 ring-1 ring-emerald-100">
        <ArrowUp className={cn("h-3 w-3", !up && "rotate-180 text-rose-600")} />
        <span className={cn(up ? "text-emerald-600" : "text-rose-600")}>{(up ? "+" : "") + delta.toFixed(1)} {deltaLabel}</span>
      </div>
      <div className="mt-2 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`g-${label}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="y" stroke={sparkColor} strokeWidth={2} fill={`url(#g-${label})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className={cn("mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2", footerTint)}>
        <FIcon className="h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <div className="text-xs font-semibold">{footerTitle}</div>
          <div className="truncate text-[11px] opacity-80">{footerNote}</div>
        </div>
      </div>
    </div>
  );
}

function RagTile({ rag, series }: { rag: Rag; series: { rag: Rag }[] }) {
  const counts = { green: 0, amber: 0, red: 0 };
  series.forEach((s) => { counts[s.rag] = (counts[s.rag] ?? 0) + 1; });
  const total = Math.max(series.length, 1);
  const pct = (n: number) => Math.round((n / total) * 100);
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">RAG Status</div>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-600 text-white"><Shield className="h-4 w-4" /></div>
      </div>
      <div className="mt-6 flex justify-center">
        <div className={cn("inline-flex items-center gap-2 rounded-full px-5 py-2 text-2xl font-bold uppercase tracking-wide", ragText[rag], "bg-white ring-1 ring-slate-200")}>
          <span className={cn("h-3 w-3 rounded-full", ragColor[rag])} />
          {rag}
        </div>
      </div>
      <div className="mt-3 text-center text-xs text-slate-500">Consistent Quality Performance</div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="bg-emerald-500" style={{ width: `${pct(counts.green)}%` }} />
        <div className="bg-amber-400" style={{ width: `${pct(counts.amber)}%` }} />
        <div className="bg-rose-500" style={{ width: `${pct(counts.red)}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-slate-600">
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{pct(counts.green)}% Green</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-amber-400" />{pct(counts.amber)}% Amber</span>
        <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-rose-500" />{pct(counts.red)}% Red</span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-2.5 py-2 text-emerald-700">
        <Award className="h-4 w-4" />
        <div className="text-xs font-semibold">Keep maintaining your great work!</div>
      </div>
    </div>
  );
}

function RatingTile({ rating, delta, prevLabel }: { rating: number; delta: number; prevLabel: string }) {
  const up = delta >= 0;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-b from-amber-50 to-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current Rating</div>
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-400 text-white"><Star className="h-4 w-4" /></div>
      </div>
      <div className="mt-3 text-4xl font-bold tracking-tight text-slate-900">{rating.toFixed(2)}</div>
      <div className="mt-2 flex gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={cn("h-5 w-5", i < full ? "fill-amber-400" : (i === full && half) ? "fill-amber-400 opacity-60" : "fill-slate-200 text-slate-200")} />
        ))}
      </div>
      <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 text-[11px] font-medium ring-1 ring-emerald-100">
        <ArrowUp className={cn("h-3 w-3", !up && "rotate-180 text-rose-600")} />
        <span className={cn(up ? "text-emerald-600" : "text-rose-600")}>{(up ? "+" : "") + delta.toFixed(2)} vs {prevLabel}</span>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-100/60 px-2.5 py-2 text-amber-800">
        <Star className="h-4 w-4" />
        <div className="min-w-0">
          <div className="text-xs font-semibold">Excellent Feedback!</div>
          <div className="truncate text-[11px] opacity-80">Members love your coaching.</div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard({ leaderboard }: { leaderboard: any[] }) {
  const [tab, setTab] = useState<"top" | "improved" | "rated">("top");
  const sorted = [...leaderboard].sort((a, b) => {
    if (tab === "rated") return Number(b.current_rating) - Number(a.current_rating);
    return Number(b.cpi) - Number(a.cpi);
  });
  const medal = (i: number) => {
    if (i === 0) return <Trophy className="h-4 w-4 text-amber-500" />;
    if (i === 1) return <Medal className="h-4 w-4 text-slate-400" />;
    if (i === 2) return <Award className="h-4 w-4 text-orange-500" />;
    return null;
  };
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-900">Leaderboards 🏆</div>
        <Link to="/my-performance" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>
      </div>
      <div className="mt-3 flex gap-1 rounded-lg bg-slate-100 p-1 text-xs">
        {[
          { k: "top", l: "Top Coaches" },
          { k: "improved", l: "Most Improved" },
          { k: "rated", l: "Top Rated" },
        ].map((t) => (
          <button key={t.k} onClick={() => setTab(t.k as any)} className={cn("flex-1 rounded-md px-2 py-1.5 font-medium transition", tab === t.k ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}>{t.l}</button>
        ))}
      </div>
      <div className="mt-3 divide-y">
        {sorted.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3 py-2.5">
            <div className="w-4 text-xs font-semibold text-slate-400">{i + 1}</div>
            <div className="w-5">{medal(i)}</div>
            <div className="flex-1 truncate text-sm font-medium text-slate-800">{c.profiles?.full_name ?? "Coach"}</div>
            <div className="text-sm font-semibold text-slate-900">{Number(tab === "rated" ? c.current_rating : c.cpi).toFixed(1)}</div>
          </div>
        ))}
      </div>
      <Link to="/my-performance" className="mt-2 block text-center text-xs font-medium text-indigo-600 hover:underline">See full leaderboard</Link>
    </div>
  );
}

function QuickAction({ to, icon: Icon, tone, title, subtitle }: { to: string; icon: LucideIcon; tone: string; title: string; subtitle: string }) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-indigo-300 hover:shadow-sm">
      <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tone)}><Icon className="h-4 w-4" /></div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-800">{title}</div>
        <div className="truncate text-[11px] text-slate-500">{subtitle}</div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-600" />
    </Link>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { MeData } from "@/lib/qip/auth";
import {
  ClipboardCheck,
  CheckCircle2,
  ShieldCheck,
  Users,
  Sparkles,
  PieChart as PieIcon,
  Calendar,
  Filter,
  ChevronRight,
  Trophy,
  UserPlus,
  UserCog,
  FileBarChart,
  ArrowUp,
  ArrowDown,
  Star,
  Gauge,
  MessageSquare,
  type LucideIcon,
} from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Tone = "blue" | "green" | "orange" | "purple" | "emerald" | "rose" | "indigo" | "teal";

const toneMap: Record<Tone, { bg: string; fg: string }> = {
  blue:    { bg: "bg-blue-100",    fg: "text-blue-600" },
  green:   { bg: "bg-green-100",   fg: "text-green-600" },
  orange:  { bg: "bg-orange-100",  fg: "text-orange-600" },
  purple:  { bg: "bg-purple-100",  fg: "text-purple-600" },
  emerald: { bg: "bg-emerald-100", fg: "text-emerald-600" },
  rose:    { bg: "bg-rose-100",    fg: "text-rose-600" },
  indigo:  { bg: "bg-indigo-100",  fg: "text-indigo-600" },
  teal:    { bg: "bg-teal-100",    fg: "text-teal-600" },
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); }
function startOfPrevMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString(); }
function monthDateStr(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), 1);
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-01`;
}

async function countRange(filterFn: (q: any) => any) {
  const q = supabase.from("audits").select("id", { count: "exact", head: true });
  const { count } = await filterFn(q);
  return count ?? 0;
}

export function AdminDashboard({ me }: { me: MeData }) {
  const { data: stats } = useQuery({
    queryKey: ["admin-home-stats"],
    queryFn: async () => {
      const now = new Date();
      const som = startOfMonth(now);
      const sopm = startOfPrevMonth(now);
      const monthStr = monthDateStr(now);

      const [
        totalThis, totalPrev,
        pubThis, pubPrev,
        pendCoach, pendCoachPrev,
        challengesThis, challengesPrev,
        coaches,
        quotas,
      ] = await Promise.all([
        countRange((q) => q.gte("created_at", som)),
        countRange((q) => q.gte("created_at", sopm).lt("created_at", som)),
        countRange((q) => q.eq("status", "published").gte("created_at", som)),
        countRange((q) => q.eq("status", "published").gte("created_at", sopm).lt("created_at", som)),
        countRange((q) => q.eq("status", "published").eq("accepted_by_coach", false)),
        countRange((q) => q.eq("status", "published").eq("accepted_by_coach", false).lt("created_at", som)),
        supabase.from("challenges").select("id", { count: "exact", head: true }).gte("created_at", som),
        supabase.from("challenges").select("id", { count: "exact", head: true }).gte("created_at", sopm).lt("created_at", som),
        supabase.from("coaches").select("current_rag"),
        supabase.from("expert_audit_quotas").select("quota").eq("month", monthStr),
      ]);

      const completion = totalThis > 0 ? Math.round((pubThis / totalThis) * 100) : 0;
      const completionPrev = totalPrev > 0 ? Math.round((pubPrev / totalPrev) * 100) : 0;
      const cs = coaches.data ?? [];
      const rag = { green: 0, amber: 0, red: 0, none: 0 };
      cs.forEach((c: any) => {
        if (c.current_rag === "green") rag.green++;
        else if (c.current_rag === "amber") rag.amber++;
        else if (c.current_rag === "red") rag.red++;
        else rag.none++;
      });
      const totalQuota = (quotas.data ?? []).reduce((s: number, r: any) => s + Number(r.quota ?? 0), 0);
      return {
        totalThis, totalPrev,
        pubThis, pubPrev,
        pendCoach, pendCoachPrev,
        challenges: challengesThis.count ?? 0, challengesPrev: challengesPrev.count ?? 0,
        completion, completionPrev,
        totalCoaches: cs.length,
        rag,
        totalQuota,
      };
    },
  });

  const { data: top } = useQuery({
    queryKey: ["admin-top-coaches"],
    queryFn: async () => {
      const { data } = await supabase
        .from("coaches")
        .select("id,current_quality_score,current_rating,current_rag,cpi,profiles!coaches_profile_id_fkey(full_name)")
        .order("cpi", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const firstName = me.profile?.full_name?.split(" ")[0] ?? "";
  const prevMonthLabel = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    .toLocaleString("en-US", { month: "short", year: "numeric" });

  const tiles: Array<{
    label: string; value: string | number; icon: LucideIcon; tone: Tone;
    delta: number; suffix?: string;
  }> = stats ? [
    { label: "Published / Assigned",     value: `${stats.pubThis}/${stats.totalQuota}`, icon: ClipboardCheck, tone: "blue",   delta: pct(stats.pubThis, stats.pubPrev), suffix: stats.totalQuota === 0 ? "Set quotas in Experts" : `quota this month` },
    { label: "Pending Coach Acceptance", value: stats.pendCoach,        icon: Users,          tone: "emerald",delta: diff(stats.pendCoach, stats.pendCoachPrev) },
    { label: "Audit Completion Rate",    value: `${stats.completion}%`, icon: PieIcon,        tone: "teal",   delta: stats.completion - stats.completionPrev },
    { label: "Overall Coach Rating",     value: "—",                    icon: Star,           tone: "orange", delta: 0, suffix: "Source TBD" },
    { label: "Overall Quality Score",    value: "—",                    icon: Gauge,          tone: "purple", delta: 0, suffix: "Source TBD" },
    { label: "AI Challenges",            value: stats.challenges,       icon: Sparkles,       tone: "indigo", delta: diff(stats.challenges, stats.challengesPrev) },
  ] : [];

  const totalCoaches = stats?.totalCoaches ?? 0;
  const pct1 = (v: number) => totalCoaches ? Math.round((v / totalCoaches) * 100) : 0;
  const ragPie = stats ? [
    { name: "Green",     value: stats.rag.green, color: "#22c55e" },
    { name: "Amber",     value: stats.rag.amber, color: "#f59e0b" },
    { name: "Red",       value: stats.rag.red,   color: "#ef4444" },
    { name: "Not Rated", value: stats.rag.none,  color: "#cbd5e1" },
  ] : [];

  return (
    <div className="-m-4 md:-m-8 min-h-[calc(100vh-3.5rem)] bg-slate-50 p-4 md:p-6 space-y-4">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Welcome back, {firstName}! <span className="inline-block">👋</span>
          </h1>
          <p className="text-sm text-slate-500">Here's your overview of audits and coach performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
            <Calendar className="h-4 w-4 text-slate-400" /> This month
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50">
            <Filter className="h-4 w-4 text-slate-400" /> All Processes
          </button>
        </div>
      </div>

      {/* KPI Tiles — single row of 6 on lg+ */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => (
          <KpiTile key={t.label} {...t} prevLabel={prevMonthLabel} />
        ))}
      </div>

      {/* RAG + Top performers */}
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">RAG Distribution (Coaches)</div>
          <div className="mt-2 flex items-center gap-3">
            <div className="relative h-[170px] w-[170px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ragPie} dataKey="value" innerRadius={52} outerRadius={78} paddingAngle={2} stroke="none">
                    {ragPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-xl font-bold text-slate-900">{totalCoaches}</div>
                  <div className="text-[10px] text-slate-500">Total Coaches</div>
                </div>
              </div>
            </div>
            <ul className="flex-1 space-y-1.5 text-sm">
              {ragPie.map((d) => (
                <li key={d.name} className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                  <span className="font-medium text-slate-700">{d.name}</span>
                  <span className="ml-auto text-slate-500 text-xs">{d.value} ({pct1(d.value)}%)</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Top Performing Coaches</div>
            <Link to="/admin/coaches" className="text-xs font-medium text-blue-600 hover:underline">View all coaches</Link>
          </div>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="py-1.5 pr-2 text-left font-medium">Rank</th>
                <th className="py-1.5 pr-2 text-left font-medium">Coach Name</th>
                <th className="py-1.5 pr-2 text-left font-medium">Quality Score</th>
                <th className="py-1.5 pr-2 text-left font-medium">CPI</th>
                <th className="py-1.5 pr-2 text-left font-medium">Rating</th>
                <th className="py-1.5 pr-2 text-left font-medium">RAG Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(top ?? []).map((c: any, i: number) => (
                <tr key={c.id} className="text-slate-800">
                  <td className="py-1.5 pr-2">
                    <div className="flex items-center gap-1.5">
                      {i < 3 ? <Trophy className={
                        i === 0 ? "h-4 w-4 text-amber-500"
                        : i === 1 ? "h-4 w-4 text-slate-400"
                        : "h-4 w-4 text-orange-700"
                      } /> : <span className="w-4" />}
                      <span className="text-slate-500">{i + 1}</span>
                    </div>
                  </td>
                  <td className="py-1.5 pr-2 font-medium">{c.profiles?.full_name ?? "Coach"}</td>
                  <td className="py-1.5 pr-2 font-semibold">{Number(c.current_quality_score).toFixed(1)}</td>
                  <td className="py-1.5 pr-2">{Number(c.cpi).toFixed(1)}</td>
                  <td className="py-1.5 pr-2">{Number(c.current_rating).toFixed(1)}</td>
                  <td className="py-1.5 pr-2"><RagPill rag={c.current_rag} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Quick Actions</div>
        <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
          <Action to="/admin/audits"     icon={ClipboardCheck} tone="blue"   title="Assign Audits"      sub="Assign audits to experts" />
          <Action to="/admin/challenges" icon={ShieldCheck}    tone="rose"   title="Review Challenges"  sub="AI challenges pending review" />
          <Action to="/admin/audits"     icon={MessageSquare}  tone="orange" title="Review Objections"  sub="Coach objections pending" />
          <Action to="/admin/coaches"    icon={UserPlus}       tone="emerald"title="View Coaches"       sub="Browse all coaches" />
          <Action to="/admin/experts"    icon={UserCog}        tone="purple" title="View Experts"        sub="Browse all experts" />
          <Action to="/admin/reports"    icon={FileBarChart}   tone="indigo" title="Generate Reports"   sub="Create custom reports" />
        </div>
      </div>
    </div>
  );
}

function pct(curr: number, prev: number) {
  if (!prev) return curr > 0 ? 100 : 0;
  return Math.round(((curr - prev) / prev) * 100);
}
function diff(curr: number, prev: number) { return curr - prev; }

function KpiTile({ label, value, icon: Icon, tone, delta, suffix, prevLabel }: {
  label: string; value: string | number; icon: LucideIcon; tone: Tone;
  delta: number; suffix?: string; prevLabel: string;
}) {
  const t = toneMap[tone];
  const up = delta >= 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-2">
        <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${t.bg}`}>
          <Icon className={`h-4 w-4 ${t.fg}`} />
        </div>
        <div className="text-[11px] font-medium leading-tight text-slate-500">{label}</div>
      </div>
      <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{value}</div>
      <div className={`mt-0.5 flex items-center gap-1 text-[11px] ${up ? "text-emerald-600" : "text-rose-600"}`}>
        {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        <span className="font-medium">{Math.abs(delta)}{typeof value === "string" && value.endsWith("%") ? "pt" : ""}</span>
        <span className="text-slate-400">{suffix ?? `vs ${prevLabel}`}</span>
      </div>
    </div>
  );
}

function RagPill({ rag }: { rag: "red" | "amber" | "green" | null | undefined }) {
  if (!rag) return <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">—</span>;
  const map = {
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red:   "bg-red-100 text-red-700",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${map[rag]}`}>{rag}</span>;
}

function Action({ to, icon: Icon, tone, title, sub }: {
  to: string; icon: LucideIcon; tone: Tone; title: string; sub: string;
}) {
  const t = toneMap[tone];
  return (
    <Link to={to} className="group flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm transition hover:border-slate-300 hover:shadow">
      <div className={`grid h-9 w-9 place-items-center rounded-lg ${t.bg}`}>
        <Icon className={`h-4 w-4 ${t.fg}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-slate-900">{title}</div>
        <div className="truncate text-[11px] text-slate-500">{sub}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500" />
    </Link>
  );
}

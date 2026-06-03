import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MeData } from "@/lib/qip/auth";
import { PageHeader } from "../AppShell";
import { RagBadge } from "../RagBadge";
import { ClipboardCheck, Users, PieChart as PieIcon, Star, Gauge, Sparkles, ArrowUp, ArrowDown, type LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Tone = "blue" | "emerald" | "teal" | "orange" | "purple" | "indigo";
const toneMap: Record<Tone, { bg: string; fg: string }> = {
  blue:    { bg: "bg-blue-100",    fg: "text-blue-600" },
  emerald: { bg: "bg-emerald-100", fg: "text-emerald-600" },
  teal:    { bg: "bg-teal-100",    fg: "text-teal-600" },
  orange:  { bg: "bg-orange-100",  fg: "text-orange-600" },
  purple:  { bg: "bg-purple-100",  fg: "text-purple-600" },
  indigo:  { bg: "bg-indigo-100",  fg: "text-indigo-600" },
};

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1).toISOString(); }
function monthDateStr(d: Date) {
  const m = new Date(d.getFullYear(), d.getMonth(), 1);
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-01`;
}

export function ExpertDashboard({ me }: { me: MeData }) {
  const expertId = me.expertId;
  const userId = me.user?.id;
  const { data: stats } = useQuery({
    queryKey: ["expert-home-stats", expertId],
    enabled: !!expertId,
    queryFn: async () => {
      const now = new Date();
      const som = startOfMonth(now);
      const monthStr = monthDateStr(now);
      const [totalThis, pubThis, pendCoach, challenges, quotaRow] = await Promise.all([
        supabase.from("audits").select("id", { count: "exact", head: true }).eq("expert_id", expertId!).gte("created_at", som),
        supabase.from("audits").select("id", { count: "exact", head: true }).eq("expert_id", expertId!).eq("status", "published").gte("created_at", som),
        supabase.from("audits").select("id", { count: "exact", head: true }).eq("expert_id", expertId!).eq("status", "published").eq("accepted_by_coach", false),
        supabase.from("challenges").select("id", { count: "exact", head: true }).eq("raised_by", userId!).gte("created_at", som),
        supabase.from("expert_audit_quotas").select("quota").eq("expert_id", expertId!).eq("month", monthStr).maybeSingle(),
      ]);
      const total = totalThis.count ?? 0;
      const pub = pubThis.count ?? 0;
      return {
        pubThis: pub,
        totalThis: total,
        quota: Number(quotaRow.data?.quota ?? 0),
        pendCoach: pendCoach.count ?? 0,
        completion: total > 0 ? Math.round((pub / total) * 100) : 0,
        challenges: challenges.count ?? 0,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["expert-recent", expertId],
    enabled: !!expertId,
    queryFn: async () => {
      const { data } = await supabase
        .from("audits")
        .select("id,title,status,rag,total_score,max_score,coaches!audits_coach_id_fkey(profiles!coaches_profile_id_fkey(full_name))")
        .eq("expert_id", expertId!)
        .order("created_at", { ascending: false }).limit(8);
      return data ?? [];
    },
  });

  if (!expertId) {
    return (
      <div>
        <PageHeader title="Expert Dashboard" description="Your expert profile hasn't been activated yet." />
        <div className="surface-card p-8 text-sm text-muted-foreground">No expert record found for your account.</div>
      </div>
    );
  }

  const tiles: Array<{ label: string; value: string | number; icon: LucideIcon; tone: Tone; suffix?: string; delta: number }> = stats ? [
    { label: "Published / Assigned",     value: `${stats.pubThis}/${stats.quota}`,  icon: ClipboardCheck, tone: "blue",    delta: 0, suffix: stats.quota === 0 ? "No quota set" : "quota this month" },
    { label: "Pending Coach Acceptance", value: stats.pendCoach,                    icon: Users,          tone: "emerald", delta: 0 },
    { label: "Audit Completion Rate",    value: `${stats.completion}%`,             icon: PieIcon,        tone: "teal",    delta: 0 },
    { label: "Overall Coach Rating",     value: "—",                                icon: Star,           tone: "orange",  delta: 0, suffix: "Source TBD" },
    { label: "Overall Quality Score",    value: "—",                                icon: Gauge,          tone: "purple",  delta: 0, suffix: "Source TBD" },
    { label: "AI Challenges",            value: stats.challenges,                   icon: Sparkles,       tone: "indigo",  delta: 0 },
  ] : [];

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${me.profile?.full_name?.split(" ")[0] ?? "Expert"}`} description="Your audit workload and history." />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {tiles.map((t) => <Tile key={t.label} {...t} />)}
      </div>
      <div className="surface-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">Recent audits</div>
            <div className="text-xs text-muted-foreground">Latest assigned + reviewed</div>
          </div>
          <Link to="/assigned-audits" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        <div className="divide-y">
          {recent?.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="truncate text-sm font-medium">{a.title}</div>
                <div className="text-xs text-muted-foreground">Coach: {a.coaches?.profiles?.full_name ?? "—"} • Status: {a.status}</div>
              </div>
              <RagBadge rag={a.rag} />
              <div className="text-sm font-semibold">{Number(a.total_score ?? 0).toFixed(0)}/{a.max_score}</div>
            </div>
          ))}
          {(!recent || recent.length === 0) && <div className="py-6 text-center text-xs text-muted-foreground">No audits yet.</div>}
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value, icon: Icon, tone, suffix, delta }: {
  label: string; value: string | number; icon: LucideIcon; tone: Tone; suffix?: string; delta: number;
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
        {delta !== 0 && (up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
        <span className="text-slate-400">{suffix ?? ""}</span>
      </div>
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MeData } from "@/lib/qip/auth";
import { PageHeader } from "../AppShell";
import { ClipboardCheck, ChevronRight, Shield } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { RagBadge } from "../RagBadge";
import { cn } from "@/lib/utils";

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

  const { data: audits } = useQuery({
    queryKey: ["coach-dashboard-audits", coachId],
    enabled: !!coachId,
    queryFn: async () => {
      const { data } = await supabase
        .from("audits")
        .select("id,title,status,rag,total_score,max_score,accepted_by_coach,created_at")
        .eq("coach_id", coachId!)
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  if (!coachId) {
    return (
      <div>
        <PageHeader title={`Welcome, ${me.profile?.full_name?.split(" ")[0] ?? ""}`} description="Your coach profile hasn't been linked yet — a Manager will set it up." />
        <div className="surface-card p-8 text-sm text-muted-foreground">No coach record found for your account.</div>
      </div>
    );
  }

  const firstName = me.profile?.full_name?.split(" ")[0] ?? "Coach";
  const pendingCount = (audits ?? []).filter((a) => a.status === "published" && !a.accepted_by_coach).length;
  const rag = coach?.current_rag ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back, {firstName}! <span className="inline-block">👋</span></h1>
        <p className="mt-1 text-sm text-slate-500">Here's a quick look at your audits.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Current RAG</div>
          {rag ? <div className="mt-3"><RagBadge rag={rag} /></div> : <div className="mt-3 text-sm text-slate-400">No audits yet</div>}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Awaiting your review</div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{pendingCount}</div>
          <div className="mt-1 text-xs text-slate-500">Published audits you haven't accepted or challenged yet.</div>
        </div>
        <Link
          to="/my-audits"
          className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
        >
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-slate-800">View all my audits</div>
            <div className="text-[11px] text-slate-500">Accept results or raise a challenge</div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 group-hover:text-indigo-600" />
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-900">Recent audits</div>
          <Link to="/my-audits" className="text-xs font-medium text-indigo-600 hover:underline">View all</Link>
        </div>
        <div className="mt-3 divide-y">
          {(audits ?? []).map((a) => (
            <div key={a.id} className="flex items-center gap-3 py-2.5">
              <Shield className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">{a.title}</div>
                <div className="text-[11px] text-slate-500">{new Date(a.created_at).toLocaleDateString()}</div>
              </div>
              <Badge variant="outline" className="capitalize">{a.status.replace(/_/g, " ")}</Badge>
              {a.rag && <RagBadge rag={a.rag as any} />}
              <div className={cn("text-sm font-semibold text-slate-900 w-16 text-right")}>
                {Number(a.total_score ?? 0).toFixed(0)}/{a.max_score}
              </div>
            </div>
          ))}
          {(!audits || audits.length === 0) && (
            <div className="py-8 text-center text-sm text-slate-400">No audits yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

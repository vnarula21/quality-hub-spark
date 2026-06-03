import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { MeData } from "@/lib/qip/auth";
import { PageHeader } from "../AppShell";
import { KpiCard } from "../KpiCard";
import { RagBadge } from "../RagBadge";
import { ClipboardList, ClipboardCheck, History, Activity } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ExpertDashboard({ me }: { me: MeData }) {
  const expertId = me.expertId;
  const { data } = useQuery({
    queryKey: ["expert-stats", expertId],
    enabled: !!expertId,
    queryFn: async () => {
      const [{ data: assigned }, { data: published }, { data: pending }] = await Promise.all([
        supabase.from("audits").select("id").eq("expert_id", expertId!),
        supabase.from("audits").select("total_score").eq("expert_id", expertId!).eq("status", "published"),
        supabase.from("audits").select("id").eq("expert_id", expertId!).eq("status", "pending_review"),
      ]);
      const avg = (published ?? []).length
        ? (published ?? []).reduce((s, a) => s + Number(a.total_score ?? 0), 0) / (published ?? []).length
        : 0;
      return { assigned: assigned?.length ?? 0, published: published?.length ?? 0, pending: pending?.length ?? 0, avg };
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
  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome, ${me.profile?.full_name?.split(" ")[0] ?? "Expert"}`} description="Your audit workload and history." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <KpiCard label="Assigned Audits" value={data?.assigned ?? 0} icon={ClipboardList} tone="primary" />
        <KpiCard label="Pending Review" value={data?.pending ?? 0} icon={ClipboardCheck} tone="warning" />
        <KpiCard label="Published" value={data?.published ?? 0} icon={History} tone="success" />
        <KpiCard label="Avg Score Published" value={data ? data.avg.toFixed(1) : "—"} icon={Activity} />
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

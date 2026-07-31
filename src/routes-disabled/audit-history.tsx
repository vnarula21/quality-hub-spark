import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { AuditTable } from "./assigned-audits";

export const Route = createFileRoute("/_authenticated/audit-history")({ component: AuditHistory });

function AuditHistory() {
  const { data: me } = useMe();
  const expertId = me?.expertId;
  const { data } = useQuery({
    queryKey: ["audit-history", expertId],
    enabled: !!expertId,
    queryFn: async () => {
      const { data } = await supabase
        .from("audits")
        .select("*,coaches!audits_coach_id_fkey(profiles!coaches_profile_id_fkey(full_name))")
        .eq("expert_id", expertId!)
        .eq("status", "published")
        .order("published_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Audit History" description="Published audits you've conducted." />
      <AuditTable rows={data ?? []} />
    </div>
  );
}

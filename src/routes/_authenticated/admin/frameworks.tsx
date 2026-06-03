import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/frameworks")({ component: () => <Frameworks /> });

function Frameworks() {
  const { data } = useQuery({
    queryKey: ["frameworks"],
    queryFn: async () => (await supabase.from("audit_frameworks").select("*,processes(name)").order("name")).data ?? [],
  });
  return (
    <div className="space-y-6">
      <PageHeader title="Audit Frameworks" description="Scoring frameworks used for audits." />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((f: any) => (
          <div key={f.id} className="surface-card p-5">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{f.name}</div>
              <Badge variant={f.is_active ? "default" : "outline"}>{f.is_active ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">{f.description}</div>
            <div className="mt-3 text-xs">Process: <span className="font-medium">{f.processes?.name ?? "—"}</span></div>
            <div className="text-xs">Max score: <span className="font-medium">{f.total_max_score}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

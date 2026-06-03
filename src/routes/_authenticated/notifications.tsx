import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/qip/auth";
import { PageHeader } from "@/components/app/AppShell";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/notifications")({ component: Notifs });

function Notifs() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifs", me?.user.id],
    enabled: !!me,
    queryFn: async () => {
      const { data } = await supabase.from("notifications").select("*").eq("user_id", me!.user.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifs"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Notifications" description="Updates from your audits, ratings and recognition." />
      <div className="surface-card divide-y">
        {(data ?? []).map((n: any) => (
          <div key={n.id} className="flex items-start gap-3 p-4">
            <div className={"grid h-9 w-9 shrink-0 place-items-center rounded-lg " + (n.read_at ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary")}>
              <Bell className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{n.title}</div>
              {n.body && <div className="text-xs text-muted-foreground">{n.body}</div>}
              <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">{new Date(n.created_at).toLocaleString()}</div>
            </div>
            {!n.read_at && <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}><Check className="h-4 w-4" /></Button>}
          </div>
        ))}
        {(!data || data.length === 0) && <div className="p-8 text-center text-sm text-muted-foreground">You're all caught up.</div>}
      </div>
    </div>
  );
}

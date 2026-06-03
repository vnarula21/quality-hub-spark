import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/lib/qip/auth";
import { CoachDashboard } from "@/components/app/dashboards/CoachDashboard";
import { ExpertDashboard } from "@/components/app/dashboards/ExpertDashboard";
import { AdminDashboard } from "@/components/app/dashboards/AdminDashboard";
import { SuperAdminDashboard } from "@/components/app/dashboards/SuperAdminDashboard";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardSwitch,
});

function DashboardSwitch() {
  const { data: me, loading } = useMe();
  if (loading || !me) {
    return (
      <div className="grid min-h-[40vh] place-items-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  switch (me.primaryRole) {
    case "super_admin": return <SuperAdminDashboard me={me} />;
    case "admin": return <AdminDashboard me={me} />;
    case "expert": return <ExpertDashboard me={me} />;
    default: return <CoachDashboard me={me} />;
  }
}

import { createFileRoute } from "@tanstack/react-router";
import { useMe } from "@/lib/qip/auth";
import { CoachDashboard } from "@/components/app/dashboards/CoachDashboard";
import { ExpertDashboard } from "@/components/app/dashboards/ExpertDashboard";
import { AdminDashboard } from "@/components/app/dashboards/AdminDashboard";
import { SuperAdminDashboard } from "@/components/app/dashboards/SuperAdminDashboard";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardSwitch,
});

function DashboardSwitch() {
  const { data: me } = useMe();
  if (!me) return null;
  switch (me.primaryRole) {
    case "super_admin": return <SuperAdminDashboard me={me} />;
    case "admin": return <AdminDashboard me={me} />;
    case "expert": return <ExpertDashboard me={me} />;
    default: return <CoachDashboard me={me} />;
  }
}

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useSession } from "@/lib/qip/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QIP — Quality Intelligence Platform" },
      { name: "description", content: "Single source of truth for coach quality, performance, recognition and audit management." },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useSession();
  if (loading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  return <Navigate to={user ? "/dashboard" : "/auth"} replace />;
}

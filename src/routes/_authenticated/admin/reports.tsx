import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";
import { FileText } from "lucide-react";
export const Route = createFileRoute("/_authenticated/admin/reports")({ component: () => (
  <div className="space-y-6">
    <PageHeader title="Reports" description="Organizational quality reports." />
    <div className="surface-card p-10 text-center">
      <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
      <div className="mt-4 text-base font-semibold">Reporting framework ready</div>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">Phase 1 wires the data foundation. Exportable cross-org reports land in Phase 2.</p>
    </div>
  </div>
) });

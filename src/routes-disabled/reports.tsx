import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";
import { FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reports")({ component: Reports });

function Reports() {
  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Performance and audit reports." />
      <div className="surface-card p-10 text-center">
        <FileText className="mx-auto h-10 w-10 text-muted-foreground" />
        <div className="mt-4 text-base font-semibold">Reporting framework ready</div>
        <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
          The data foundation is wired. Audit history, ratings, RAG and CPI feed downstream — exportable reports will land in Phase 2.
        </p>
      </div>
    </div>
  );
}

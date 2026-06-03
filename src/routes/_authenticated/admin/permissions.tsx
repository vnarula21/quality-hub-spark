import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";
import { Check, X } from "lucide-react";

const MATRIX = [
  ["Create / edit users", true, false, false, false],
  ["Delete users", true, false, false, false],
  ["Manage roles & permissions", true, false, false, false],
  ["Manage processes & frameworks", true, false, false, false],
  ["Manage platform settings", true, false, false, false],
  ["View all coaches & experts", true, true, false, false],
  ["Review audits", true, true, true, false],
  ["Modify audit scores", true, true, true, false],
  ["Publish audits", false, false, true, false],
  ["Raise expert challenges", true, true, true, false],
  ["Raise coach objections", false, false, false, true],
  ["Accept audits", false, false, false, true],
  ["View personal performance", false, false, false, true],
  ["View all reports", true, true, false, false],
] as const;

export const Route = createFileRoute("/_authenticated/admin/permissions")({ component: () => (
  <div className="space-y-6">
    <PageHeader title="Permissions" description="Permission matrix enforced by Row Level Security in the backend." />
    <div className="surface-card overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Permission</th>
            <th className="px-4 py-3 text-center">Super Admin</th>
            <th className="px-4 py-3 text-center">Admin</th>
            <th className="px-4 py-3 text-center">Expert</th>
            <th className="px-4 py-3 text-center">Coach</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {MATRIX.map((row, i) => (
            <tr key={i}>
              <td className="px-4 py-2.5 font-medium">{row[0]}</td>
              {row.slice(1).map((v, j) => (
                <td key={j} className="px-4 py-2.5 text-center">
                  {v ? <Check className="mx-auto h-4 w-4 text-success" /> : <X className="mx-auto h-4 w-4 text-muted-foreground/40" />}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
) });

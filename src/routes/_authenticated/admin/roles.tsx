import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";
import { Check, X } from "lucide-react";

const ROLES = [
  { code: "super_admin", name: "Super Admin", desc: "Full platform control.", perms: ["Create / edit / deactivate / delete users", "Create & manage roles", "Manage permissions", "Assign coaches to auditors"] },
  { code: "admin", name: "Manager", desc: "Oversees quality operations.", perms: ["View all coaches and experts", "Review audits & challenges", "Modify audit scores & feedback", "Publish audits to coaches", "View reports & dashboards"], cant: ["Delete users", "Create/manage roles", "Assign coaches to auditors"] },
  { code: "expert", name: "Auditor", desc: "Audits the calls and chats of their assigned coaches.", perms: ["View coaches assigned to them", "Transcribe and AI-audit calls & chats", "Edit AI-generated scores once before locking"], cant: ["Audit coaches not assigned to them", "Publish audits directly to the coach"] },
  { code: "coach", name: "Coach", desc: "Healthcare coach delivering care to members.", perms: ["View own audit results once published", "Accept a published audit", "Raise one challenge per audit for re-review"] },
];

const MATRIX = [
  ["Create / edit / delete users", true, false, false, false],
  ["Manage roles & permissions", true, false, false, false],
  ["Assign coaches to auditors", true, false, false, false],
  ["View all coaches & experts", true, true, false, false],
  ["Audit coaches assigned to them", false, false, true, false],
  ["Review audits & challenges", true, true, false, false],
  ["Modify audit scores & feedback", true, true, false, false],
  ["Publish audits to coach", true, true, false, false],
  ["Accept / challenge own audits", false, false, false, true],
  ["View reports & dashboards", true, true, false, false],
] as const;

export const Route = createFileRoute("/_authenticated/admin/roles")({ component: () => (
  <div className="space-y-6">
    <PageHeader title="Roles & Permissions" description="Built-in roles and what each can do. Assign roles from the Users page." />
    <div className="grid gap-4 lg:grid-cols-2">
      {ROLES.map((r) => (
        <div key={r.code} className="surface-card p-5">
          <div className="text-base font-semibold">{r.name}</div>
          <div className="mt-1 text-xs text-muted-foreground">{r.desc}</div>
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Can</div>
            <ul className="mt-1 space-y-1 text-sm">
              {r.perms.map((p) => <li key={p}>• {p}</li>)}
            </ul>
          </div>
          {r.cant && (
            <div className="mt-4">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cannot</div>
              <ul className="mt-1 space-y-1 text-sm text-muted-foreground">
                {r.cant.map((p) => <li key={p}>• {p}</li>)}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>

    <div className="surface-card overflow-hidden">
      <div className="border-b px-4 py-3 text-sm font-semibold">Permission matrix</div>
      <table className="w-full text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left">Permission</th>
            <th className="px-4 py-3 text-center">Super Admin</th>
            <th className="px-4 py-3 text-center">Manager</th>
            <th className="px-4 py-3 text-center">Auditor</th>
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

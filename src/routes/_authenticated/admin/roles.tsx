import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";

const ROLES = [
  { code: "super_admin", name: "Super Admin", desc: "Full platform control.", perms: ["Create / edit / deactivate / delete users", "Create & manage roles", "Manage permissions", "Assign coaches to auditors"] },
  { code: "admin", name: "Manager", desc: "Oversees quality operations.", perms: ["View all coaches and experts", "Review audits & challenges", "Modify audit scores & feedback", "Publish audits to coaches", "View reports & dashboards"], cant: ["Delete users", "Create/manage roles", "Assign coaches to auditors"] },
  { code: "expert", name: "Auditor", desc: "Audits the calls and chats of their assigned coaches.", perms: ["View coaches assigned to them", "Transcribe and AI-audit calls & chats", "Edit AI-generated scores once before locking"], cant: ["Audit coaches not assigned to them", "Publish audits directly to the coach"] },
  { code: "coach", name: "Coach", desc: "Healthcare coach delivering care to members.", perms: ["View own audit results once published", "Accept a published audit", "Raise one challenge per audit for re-review"] },
];

export const Route = createFileRoute("/_authenticated/admin/roles")({ component: () => (
  <div className="space-y-6">
    <PageHeader title="Roles" description="Built-in roles and their permissions. Assign roles from the Users page." />
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
  </div>
) });

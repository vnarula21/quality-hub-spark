import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/AppShell";

const ROLES = [
  { code: "super_admin", name: "Super Admin", desc: "Full platform control. Manages users, roles, processes and platform settings.", perms: ["Create / edit / deactivate / delete users", "Create roles", "Manage permissions", "Manage platform settings", "Manage processes", "Access all reports & dashboards"] },
  { code: "admin", name: "Admin (Quality Manager)", desc: "Oversees quality operations.", perms: ["View all coaches and experts", "Review audits & challenges", "Modify audit scores & feedback", "View reports & dashboards"], cant: ["Delete users", "Change platform settings", "Publish audits"] },
  { code: "expert", name: "Expert", desc: "Reviews and publishes audits.", perms: ["View assigned audits", "Upload audit material", "Review audits", "Publish final audits", "View audit history & reports"] },
  { code: "coach", name: "Coach", desc: "Healthcare coach delivering care to members.", perms: ["View personal dashboard", "View performance metrics & ratings", "View testimonials & success stories", "View audit results", "Accept audits", "Raise objections"] },
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

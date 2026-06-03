## Goal

Extend the existing `resetAndSeed` flow so a Super Admin (or anyone, on a fresh empty DB) can click one button and get:

- 4 real auth users with known passwords (auto-confirmed, ready to log in immediately)
- Correct role assignments (overriding the default "coach" from `handle_new_user`)
- Linked `coaches` / `experts` rows
- All existing demo data (audits, ratings, RAG reports, testimonials, achievements)
- The credentials displayed on-screen after seeding completes

## Sample credentials

| Role            | Email                  | Password    |
|-----------------|------------------------|-------------|
| Super Admin     | `superadmin@qip.test`  | `Admin123!` |
| Quality Manager | `manager@qip.test`     | `Admin123!` |
| Auditor (Expert)| `auditor@qip.test`     | `Admin123!` |
| Coach           | `coach@qip.test`       | `Admin123!` |

Plus 7 additional sample coaches with auto-generated emails (no login) to populate leaderboards.

## Changes

### 1. `src/lib/qip/seed.functions.ts` — extend `resetAndSeed`

- Run inside a server fn using `supabaseAdmin` (service role bypasses RLS).
- For each of the 4 sample accounts:
  1. `supabaseAdmin.auth.admin.listUsers()` → if email exists, delete it first (clean reset).
  2. `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name } })` — `email_confirm: true` skips email verification so password sign-in works immediately.
  3. The `handle_new_user` trigger auto-creates `profiles` row + a default role. **Override** the default by deleting the trigger-inserted `user_roles` row for that user and inserting the correct role.
  4. For the auditor → insert `experts` row linked to `profile_id`.
  5. For the coach → insert `coaches` row linked to `profile_id` with realistic metrics.
- Seed additional 7 stub coaches (existing logic) so leaderboards/charts are populated.
- Seed audits, ratings, RAG reports, testimonials, achievements (existing logic, kept).
- Return the credentials list so the UI can display them.

### 2. `src/routes/_authenticated/admin/settings.tsx` — UI

- Keep the existing "Reset & Seed" button.
- On success, render a "Sample credentials" card with the 4 rows + copy-to-clipboard buttons and a warning ("Demo data — do not use in production").
- Add a "Seeding will delete and recreate the 4 sample auth accounts" confirmation dialog.

### 3. Auth config

- Call `supabase--configure_auth` to set `auto_confirm_email: true` (only for this demo project) — belt-and-braces in case anyone signs up manually with the same emails.

### 4. First-run bootstrap on `/auth` page

- Add a small "Load demo data" link on `/auth` that, when the database has zero users, calls a **public** server route (`/api/public/bootstrap-demo`) which runs the same seeder. This solves the chicken-and-egg problem: right now there's no Super Admin to log in as, so there's no way to reach `/admin/settings` to click the button.
- The route is guarded: it 403s if any `super_admin` already exists, so it's only usable on a brand-new DB.

## Technical notes

- `supabaseAdmin.auth.admin.createUser` requires `SUPABASE_SERVICE_ROLE_KEY` (already in secrets).
- Import `supabaseAdmin` lazily with `await import("@/integrations/supabase/client.server")` inside the `.handler()` to keep it out of the client bundle.
- The bootstrap route lives at `src/routes/api/public/bootstrap-demo.ts` and uses a server-route handler (not `createServerFn`) so it can be called without auth.
- No schema changes needed — all tables, RLS, and the `handle_new_user` trigger stay as-is.

## Flow after implementation

1. Fresh user opens `/auth` → sees "Load demo data" link → clicks it → seeder runs → page shows the 4 credentials.
2. User signs in as `superadmin@qip.test / Admin123!` → lands on Super Admin dashboard.
3. From `/admin/settings`, Super Admin can re-run reset & seed any time to wipe and re-create.

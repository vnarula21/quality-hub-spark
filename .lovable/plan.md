## Goal

Replace the 8 KPI tiles on the Admin Dashboard (and parallel tiles on the Expert Dashboard) with 6 focused tiles, and add a monthly audit quota system so admins can set how many audits each expert should publish each month.

## New 6 KPI Tiles

1. **Published / Assigned Audits** — `published this month / monthly quota` (sum of quotas across all experts on the admin dashboard; the expert's own quota on the expert dashboard).
2. **Pending Coach Acceptance** — audits with `status = 'published'` and `accepted_by_coach = false`.
3. **Audit Completion Rate** — published ÷ total audits this month (%).
4. **Overall Coach Rating** — placeholder tile (value source to be defined later by the user; show `—` for now with a small "TBD" hint).
5. **Overall Coach Quality Score** — placeholder tile (same as above).
6. **AI Challenges** — count of `challenges` raised this month (any status), all-rows for admin, filtered by `raised_by = me` for expert.

The RAG Distribution, Top Performing Coaches, and Quick Actions sections below stay unchanged.

## Database Changes

New table `expert_audit_quotas`:
- `expert_id uuid` → experts.id
- `month date` (first of month)
- `quota int` (target number of published audits)
- unique (expert_id, month)
- RLS: experts read own; admin/super_admin manage all
- GRANTs for authenticated + service_role

## Admin UI for Quotas

Add a "Audit Quotas" section to `/admin/experts` (existing page):
- Table of experts × current month with editable quota input
- Save updates `expert_audit_quotas` via a `createServerFn` mutation
- Default quota = 0 if no row exists

## Files Changed

- `supabase/migrations/...` — new table + RLS + GRANTs
- `src/components/app/dashboards/AdminDashboard.tsx` — swap tiles array, add quota query
- `src/components/app/dashboards/ExpertDashboard.tsx` — same 6 tiles scoped to the expert
- `src/routes/_authenticated/admin/experts.tsx` — add quota editor section
- `src/lib/qip/quotas.functions.ts` (new) — getQuotas / setQuota serverFns

## Behavior Notes

- "This month" = from start of current calendar month.
- If total quota = 0, the tile shows `published / 0` with a subtle "Set quotas" link to `/admin/experts`.
- Placeholder tiles (Rating, Quality Score) render the same KpiTile shell with value `—` and footer text "Source TBD".

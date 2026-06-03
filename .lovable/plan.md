## Admin Dashboard Redesign — match attached mockup

Rebuild `src/components/app/dashboards/AdminDashboard.tsx` to mirror the uploaded screenshot exactly, fitting in one viewport (no scroll on ~1032×575+ desktop).

### Layout (3 rows, no scroll)

```
Row 1 — Welcome header + filters (date range, process filter)
Row 2 — 8 KPI tiles in a single horizontal row
Row 3 — RAG Distribution donut (left, ~1/3) + Top Performing Coaches table (right, ~2/3)
Row 4 — Quick Actions: 6 horizontal action cards
```

### KPI tiles (exact order + labels from mockup)
1. Total Audits This Month — clipboard icon, blue
2. Published Audits — check circle, green
3. Pending Expert Review — user icon, orange
4. Pending Admin Review — shield, purple
5. Pending Coach Acceptance — users, green
6. Coach Objections — chat, red/pink
7. AI Challenges — star, blue
8. Audit Completion Rate — circle %, teal

Each tile: soft pastel circular icon bg, label (top, small gray), big number (3xl), delta line with up/down arrow + "vs Apr 2025".

### RAG Distribution card
Donut with center label "185 Total Coaches", legend right side: Green 122 (66%), Amber 40 (22%), Red 18 (10%), Not Rated 5 (2%). Colors match mockup (green/amber/red/gray).

### Top Performing Coaches table
Columns: Rank (trophy icon for top 3), Coach Name, Quality Score, CPI, Rating, RAG Status (pill), Audits Completed (This Month). 5 rows. "View all coaches" link top-right.

### Quick Actions row
6 cards: Assign Audits, Review Challenges, Review Objections, Add Coach, Add Expert, Generate Reports — icon + title + subtitle + chevron right.

### Color theme (light, matches mockup)
- Background: near-white `#f7f8fa`
- Card: white with subtle border + soft shadow
- Tile icon backgrounds: soft tints (blue-50, green-50, orange-50, purple-50, red-50, teal-50)
- Text: slate-900 headings, slate-500 labels
- Keep existing dark sidebar; only redesign main content surface to light theme for admin dashboard.

### Density / no-scroll
- Use compact spacing (`gap-3`, `p-4`), `text-2xl` for KPI numbers (not 3xl), `text-[11px]` labels, table row height `py-2`.
- Quick Actions one row (6 cols on lg, wrap on smaller).
- KPI row: 8 cols on xl, 4 on lg, 2 on sm.

### Data wiring
Reuse existing queries in `AdminDashboard.tsx`; add queries for:
- Published audits count, pending expert/admin/coach-acceptance counts, AI challenges count, audit completion rate %, deltas vs prior month (compute from `audits` created_at).
- Top coaches: add `audits_completed_this_month` via count query on `audits` per coach for current month.

### Files
- Rewrite `src/components/app/dashboards/AdminDashboard.tsx` only.
- No route or auth changes. No sidebar changes.

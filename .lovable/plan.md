## Goal

Redesign the Coach Dashboard to match the reference screenshot — 4 hero KPI tiles on top, a 3-up middle row (Performance Trend, RAG Trend, Leaderboards), and a Quick Actions row at the bottom.

## Top Row — 4 hero KPI tiles

Replace the current 8-tile grid with 4 large cards:

1. **Quality Score** — big number `/100`, "+X pts vs prev month" pill, mini sparkline (area), green "Excellent Quality!" footer.
2. **RAG Status** — large GREEN/AMBER/RED pill, mini horizontal stacked bar showing the coach's % of months in each RAG band over the last 6 months, contextual footer ("Keep maintaining…", "Needs attention", etc.).
3. **Coach Performance Index (CPI)** — big number `/100`, "+X pts vs prev month" pill, mini sparkline, "Outstanding!" / "Top 1% of coaches" footer.
4. **Current Rating** — big number, 5-star visual, "+X vs prev month" pill, "Excellent Feedback!" footer.

Each tile uses a soft tinted background (emerald, slate, indigo, amber) and a colored corner icon badge, matching the reference.

## Middle Row — 3 panels

1. **Performance Trend (Last 6 Months)** — line chart with two series: Quality Score (green) and CPI Score (blue), end-of-line value labels, "View full performance" link.
2. **RAG Trend (Last 6 Months)** — Since RAG is a single value per month, render a **6-cell horizontal timeline strip**: one rounded square per month (Dec…May), filled green/amber/red, month label below, and the latest cell slightly larger/ringed. Below the strip: small legend (Green/Amber/Red) and "View RAG history" link. This reads as a trend without faking stacked %.
3. **Leaderboards** — tabs (Top Coaches / Most Improved / Top Rated), ranked list of 5 with medal icons for top 3 and CPI on the right, "See full leaderboard" link.

## Bottom Row — Quick Actions

Horizontal row of 6 action cards (icon + title + subtitle + chevron):
View My Audits, View My Performance, View My Ratings, View Testimonials, View Success Stories, View Achievements. Each links to the existing route.

## Files Changed

- `src/components/app/dashboards/CoachDashboard.tsx` — full visual rewrite (queries reused; add a "previous month" delta query and a 6-month RAG strip query).
- `src/styles.css` — add soft tile background tokens if needed (emerald/indigo/amber/slate tints) to keep usage of semantic tokens.

## Behavior Notes

- Deltas (e.g. "+6.8 pts vs Apr") computed by comparing current month vs prior month from `rag_reports` / `ratings` / `coaches` snapshot.
- RAG strip uses the last 6 entries from `rag_reports` for the coach; if fewer than 6, left-pad with empty cells.
- All data sources stay the same — no DB changes.
- No new routes; Quick Actions link to existing `/my-*` pages.

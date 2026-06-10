## NHS AI Audit — Build Plan

### Scoring & flow (confirmed)
- Scoring: **0 = poor, 1 = somewhat done, 2 = done correctly** (per parameter)
- Audit result **auto-saves** to DB on every run
- Expert can click **Challenge** → unlocks score edits + per-parameter notes → **Save Audit** (note: "Once saved, cannot be edited again")
- After save, edits locked. **Coach can challenge** → unlocks a one-time re-edit for the expert
- Guidance textarea starts blank every time (no remembering)

### Transcript storage
- Transcript stays in browser React state during the session (not persisted) until audit runs
- When audit runs and saves, we also persist transcript text on `call_transcripts` (linked to the new audit row), so the saved audit is reviewable later

---

### 1. Database migration

**Extend `audit_frameworks`:**
- `criteria jsonb` — list of parameters: `[{ no, name, guidance, max:2 }]`
- `zero_tolerance text` — optional ZT rule (e.g. "Pitching irrelevant programs")
- `kind text` — `'call' | 'chat'`

**Extend `audits`:**
- `ai_result jsonb` — full AI output (per-parameter scores, evidence, summary, strengths, improvements)
- `edited_by_expert boolean default false`
- `locked boolean default false` — true after expert saves
- `challenge_count int default 0` — coach challenges issued (max 1 → unlocks one re-edit)
- `re_edit_allowed boolean default false` — set true when coach challenges
- `final_total int`, `final_max int`, `final_rag text` — final values after expert edits (separate from raw `ai_result`)

**Extend `audit_scores`:**
- `expert_note text` — note expert adds when challenging a score

**Seed 2 frameworks:**
- **NHS Call Audit** — 15 parameters from the call sheet, max 30, with ZT flag
- **NHS Chat Audit** — parameters from the chat sheet, 0/1/2 each

---

### 2. Server function: `src/lib/qip/audit.functions.ts`

`runAudit({ framework_id, transcript, turns, guidance, call_transcript_id })`:
1. Load framework + criteria
2. Call `google/gemini-3-flash-preview` via Lovable AI Gateway with `Output.object` Zod schema:
   - `parameters: [{ no, name, score:0|1|2, reasoning, evidence_quote }]`
   - `zero_tolerance_hit: boolean`, `zero_tolerance_reason?: string`
   - `total`, `max`, `rag: 'red'|'amber'|'green'`
   - `summary`, `strengths[]`, `improvements[]`
3. System prompt: strict NHS QA auditor; score each parameter against its guidance; cite evidence; apply ZT rule (if hit → flag, score capped/zero per sheet rule)
4. **Auto-save**: insert `audits` row (status=`completed`, `ai_result`, totals, `locked=false`), insert one `audit_scores` row per parameter, link `call_transcripts.audit_id` (persist transcript text now)
5. Return `{ audit_id, result }`

`challengeAudit({ audit_id, edited_scores: [{criterion_no, score, expert_note}] })`:
- Requires `locked=false` OR (`locked=true` AND `re_edit_allowed=true`)
- Updates `audit_scores`, recomputes `final_total`/`final_rag`, sets `locked=true`, `edited_by_expert=true`, resets `re_edit_allowed=false`

`coachChallenge({ audit_id })`:
- Coach role check; sets `re_edit_allowed=true`, increments `challenge_count` (block if already >0)

---

### 3. UI on `/assigned-audits`

After transcript renders:
- **"Audit with AI"** button → dialog:
  - Framework dropdown (Call / Chat) — auto-selected from call type if possible
  - Guidance textarea (blank, optional, placeholder examples: "Focus on empathy", "Strict on ZT")
  - **Run Audit** button → calls `runAudit` → renders result + auto-save toast

**Audit result panel** (below transcript):
- Header: total `X / 30`, RAG badge, ZT flag
- Per-parameter cards: name, score chip (0/1/2), reasoning, evidence quote (collapsible)
- Summary, Strengths, Improvements sections
- **Challenge** button (visible if `!locked` OR `re_edit_allowed`) → switches cards to edit mode (score dropdown + note textarea per row) → **Save Audit** button
- Small inline notice: *"Once saved, the audit cannot be edited again unless a coach challenges it."*
- Once `locked=true`: read-only view with "Locked" badge

---

### Open question
Should the AI's raw audit be visible to the coach even before the expert challenges/saves, or only after the expert finalizes? (Default: coach sees only finalized audits.)

---

### Out of scope (this round)
- Coach review screen (we'll add the `coachChallenge` server fn + button; full coach dashboard later)
- Bulk audit
- Exporting audit PDF

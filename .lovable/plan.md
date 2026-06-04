## Goal

Add a "Save transcript" action under the transcription result so the user can persist it and later attach it to an audit. Transcripts auto-expire after ~60 days to keep storage lean.

## Database

New table `public.call_transcripts` (via migration):

- `id` uuid pk
- `created_by` uuid (auth.uid())
- `coach_id` uuid null (optional link, for later audit step)
- `audit_id` uuid null (filled when audit is created later)
- `source_type` text ('url' | 'upload')
- `source_url` text null
- `file_name` text null
- `language` text null
- `duration_seconds` numeric null
- `transcript` text not null
- `segments` jsonb null
- `raw` jsonb null
- `expires_at` timestamptz not null default `now() + interval '60 days'`
- `created_at`, `updated_at` timestamps

Grants + RLS:
- `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated; GRANT ALL ... TO service_role;`
- Enable RLS. Policies:
  - `created_by = auth.uid()` for select/insert/update/delete
  - Admin/super_admin full access via `has_role(...)`

Cleanup: a Postgres function `public.purge_expired_call_transcripts()` that deletes rows where `expires_at < now()`. (Schedule via pg_cron later; for now the function exists and can be invoked manually. No cron in this step to keep scope tight.)

## Server function

`src/lib/qip/transcribe.functions.ts` — add `saveTranscript` createServerFn:
- Protected with `requireSupabaseAuth`
- Input (Zod): `transcript` (string, 1..200000), `language?`, `duration?`, `segments?`, `source_type` enum, `source_url?`, `file_name?`, `raw?`
- Inserts row via authenticated supabase client (RLS applies). Returns `{ id, expires_at }`.

## UI

`src/routes/_authenticated/assigned-audits.tsx` — in the result card:
- Add a "Save transcript" button next to the transcript
- On click: call `saveTranscript` with current `result` + source info (track `source_type`/`source_url`/`file_name` in state when transcribing)
- Disable button while saving and after success; show toast "Saved — expires {date}"
- Store returned `id` in state so a future "Start audit" step can reference it
- Remove the debug "Show raw response" `<details>` block (no longer needed)

No changes to auth, sidebar, or other routes. The next step (audit creation linked to `audit_id`) is intentionally deferred.

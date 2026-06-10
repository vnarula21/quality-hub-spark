## API details (confirmed)
- **Endpoint:** `POST https://apiv6.goqii.com/vertex/recording`
- **Headers:** `clientId: 5tra1IQYBCog7Wcaqtd7aa7f`, `clientSecret: <secret>`, `Content-Type: application/json`
- **Body:** `{ "file": "<public mp3 url>", "prompt": "<prompt text>" }`
- **Prompt to use** (your exact one): `"Transcribe this call in dialogue format. Two speakers: COACH (initiates call, asks questions, gives advice) and PLAYER (answers questions, shares health info). Format: COACH: [text] PLAYER: [text]. Never merge turns. No timestamps or commentary."`

## Steps

### 1. Secrets
- Add `GOQII_CLIENT_SECRET` (you'll paste it into the secure form when prompted).
- `clientId` is non-sensitive — hardcode it in the server function. (Move to a secret too if you prefer; tell me.)

### 2. Storage bucket for uploads
Since the API only accepts a public URL, create a **public** Lovable Cloud storage bucket `call-recordings`:
- Public read (so the API can fetch the file).
- Authenticated insert (any logged-in user can upload).
- Files auto-deleted via the existing `purge_expired_call_transcripts` cron pattern — or keep simple and rely on manual cleanup. (I'll just upload; cleanup can come later.)

### 3. Rewrite `src/lib/qip/transcribe.functions.ts`
- New `callDialogueApi(fileUrl: string)`:
  - POST to goqii endpoint with the two headers + JSON body.
  - Log raw response (for debugging the shape).
  - Extract text from `json.text ?? json.transcript ?? json.data ?? json.result ?? (typeof json === 'string' ? json : '')`.
  - `parseTurns(text)` — regex `/^\s*(COACH|PLAYER)\s*:\s*/gim` to split into `{ speaker, text }[]`.
  - Return `{ raw_text, turns, language?, duration? }`.
- `transcribeUrl({ url })` — pass the URL straight through to the API.
- `transcribeUpload(formData)` — upload the file to the `call-recordings` bucket via `supabaseAdmin`, get the public URL, then call the API with that URL.
- `saveTranscript` — extend to also store `turns` in the existing `segments` JSONB column (no DB migration needed).

### 4. UI (`src/routes/_authenticated/assigned-audits.tsx`)
- Remove the `groupSegmentsBySpeaker` pause-based heuristic.
- Render `result.turns` directly as Coach (left, neutral bubble) / Player (right, primary-tinted bubble).
- Keep the "Swap Coach / Player" toggle (swaps which side each label sits on).
- Fallback to paragraph view if `turns.length === 0`.

### 5. Verify
- Upload a short mp3 in the UI → confirm it lands in `call-recordings`, public URL works, API returns dialogue, bubbles render correctly.
- Inspect server logs for the raw goqii response to confirm the parser caught the right field. Adjust if needed.

### 6. Cleanup
- After it works, remove old `ASR_API_KEY` secret.

## Things I'm assuming (correct me if wrong)
- Response contains a text field with the formatted `COACH: ... PLAYER: ...` string (we'll log the raw shape to verify on first run).
- API latency is acceptable for synchronous request (no polling/job queue needed).
- Public storage bucket is OK for call recordings. **If recordings are sensitive PHI**, we should NOT make them public — in that case the goqii API would need to support signed URLs or direct upload. Let me know.

**Reply with "go" and I'll switch to build mode, request the secret, and ship.**
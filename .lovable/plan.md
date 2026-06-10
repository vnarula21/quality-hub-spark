## Goal
Replace the current ASR with your new dialogue-transcription API that returns COACH/PLAYER turns directly, and render them as chat bubbles in the audit screen.

## What I need from you
1. **API URL** (endpoint to POST to)
2. **Auth** — secret key name + how it's sent (header name? `Authorization: Bearer ...`? `X-API-Key`?)
3. **Response shape** — sample JSON (or plain text). I'll adapt the parser to whatever it returns.
4. **File input mode** — since both are supported, I'll default to **multipart upload** (sends file bytes from our server, no need to host audio publicly). If you'd rather pass the public URL, say so.
5. **Request body fields** — confirm the exact keys. Your example uses `file` + `prompt`; I'll use those unless the docs say otherwise.

Once you share the docs/sample, I'll store the key as a new secret (e.g. `DIALOGUE_ASR_API_KEY`) and wire it up.

## Implementation plan

### 1. Secret
- Add new secret for the API key via the secrets tool (name confirmed with you, e.g. `DIALOGUE_ASR_API_KEY`).
- Remove old `ASR_API_KEY` after the swap is verified.

### 2. Rewrite `src/lib/qip/transcribe.functions.ts`
- Replace `callAsr` with `callDialogueApi(file, filename)` that:
  - POSTs to your new endpoint with the auth header.
  - Body: multipart `file` + `prompt` field set to your exact prompt string:
    > "Transcribe this call in dialogue format. Two speakers: COACH (initiates call, asks questions, gives advice) and PLAYER (answers questions, shares health info). Format: COACH: [text] PLAYER: [text]. Never merge turns. No timestamps or commentary."
  - Parses the response into a normalized shape:
    ```ts
    type DialogueResult = {
      raw_text: string;
      turns: Array<{ speaker: "COACH" | "PLAYER"; text: string }>;
      language?: string;
      duration?: number;
    }
    ```
  - Parser: regex-split on `^(COACH|PLAYER):` (case-insensitive, multiline) so even if the API returns one long string, we get clean turns.
- Keep `transcribeUpload` and `transcribeUrl` signatures so the UI doesn't break — they call the new function instead.
- Update `saveTranscript` to also accept/persist `turns` (stored in the existing `segments` JSONB column — no migration needed).

### 3. Update UI (`src/routes/_authenticated/assigned-audits.tsx`)
- Remove the pause-based `groupSegmentsBySpeaker` heuristic.
- Render `result.turns` directly as Coach/Player chat bubbles (left=Coach neutral, right=Player primary-tinted).
- Keep the existing "Swap Coach / Player" button (flips which label sits on which side).
- Fallback: if `turns` is empty, show `raw_text` in a paragraph view.

### 4. Verify
- Run a transcribe via the UI on a sample file.
- Check server logs for the raw API response, confirm the parser produces clean turns.
- Remove old `ASR_API_KEY` secret only after success.

## Out of scope
- DB schema changes (reusing `segments` JSONB).
- AssemblyAI fallback (you chose "Replace entirely").

**Reply with the API docs / sample response and I'll switch to build mode and ship it.**
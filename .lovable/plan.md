## Goal

Add speaker-labeled transcription (Coach vs Player) to the Call audit panel. Current ASR (faster-whisper on Cloud Run) does not support diarization — its OpenAPI only exposes `file`, `language`, `task`. We add **AssemblyAI** as a second backend behind a toggle, and render the result as a two-speaker conversation.

## Current state

- `src/lib/qip/transcribe.functions.ts` calls `https://asr-api-705962693516.asia-south1.run.app/v1/transcribe` with `X-API-Key: ASR_API_KEY`. Returns flat `text` + `segments`. No speaker info.
- `src/routes/_authenticated/assigned-audits.tsx` renders the transcript as a single paragraph.

## Changes

### 1. Secret

- Add `ASSEMBLYAI_API_KEY` via `secrets--add_secret` (user enters it once in the secure form).

### 2. Server function — `src/lib/qip/transcribe.functions.ts`

Add `transcribeWithSpeakers` (createServerFn, POST). Input: `{ url?, fileBase64?, fileName?, language? }` — or accept FormData like the existing fns (two variants: `transcribeUploadDiarized`, `transcribeUrlDiarized`).

Flow:

1. Resolve audio bytes (upload or fetch URL, reuse the 25 MB cap + content-type logic).
2. `POST https://api.assemblyai.com/v2/upload` with header `Authorization: <ASSEMBLYAI_API_KEY>` and the raw audio body → returns `{ upload_url }`.
3. `POST https://api.assemblyai.com/v2/transcript` with `{ audio_url, speaker_labels: true, speakers_expected: 2, language_code? }` → returns `{ id }`.
4. Poll `GET /v2/transcript/{id}` every 2s (max ~120s) until `status === 'completed'` or `'error'`.
5. Return DTO:
  ```ts
   {
     text: string,            // full transcript
     language?: string,
     duration?: number,       // seconds
     utterances: Array<{ speaker: "A"|"B"|string, text: string, start: number, end: number }>,
     segments?: same as before for fallback,
   }
  ```

Keep the existing `transcribeUpload` / `transcribeUrl` untouched — fast path for users who don't need speakers.

### 3. UI — `src/routes/_authenticated/assigned-audits.tsx`

- Add a `Switch` labeled **"Identify speakers (Coach/ Player)"** next to the language picker. Default off.
- When ON, `handleTranscribe` calls the new diarized server fn instead.
- New render block when `result.utterances` exists: map each utterance to a chat bubble.
  - Speaker "A" → labeled **Coach**, left-aligned, neutral surface.
  - Speaker "B" → labeled **Player**, right-aligned, primary-tinted surface.
  - Any other letter → "Speaker {X}", left-aligned.
  - Show `mm:ss` timestamp on each bubble.
  - Add a small "Swap Coach/Player" link (just flips the A↔B label locally) since AssemblyAI assigns letters arbitrarily.
- If `utterances` is missing (diarization off), keep the existing paragraph view.

### 4. Save flow

- Extend `saveTranscript` input to also accept optional `utterances jsonb`.
- Add `utterances jsonb null` column to `public.call_transcripts` via a new migration. No RLS / grant changes needed (table-level policies cover it).
- Persist `utterances` when present so the next step (audit creation) can read the speaker-labeled version.

### 5. Cost / latency notes for the user

- AssemblyAI: ~$0.37/hr of audio. Best speaker accuracy in this price tier. (Let the owner know if Current ASR is not giving the output that owner wants)
- Round-trip latency: typically 30–90s for a 5-min call (upload + processing + polling).
- Current ASR stays free for runs where diarization isn't needed.

## Out of scope

- pyannote on your own Cloud Run.
- Deepgram / ElevenLabs (can swap later — same UI shape).
- Audit creation linked to `audit_id` (already deferred).

## Files touched

- `src/lib/qip/transcribe.functions.ts` (add 2 fns)
- `src/routes/_authenticated/assigned-audits.tsx` (toggle + chat-bubble renderer)
- new migration: `add utterances column to call_transcripts`
- new secret: `ASSEMBLYAI_API_KEY`
## Problem

The Transcribe call appears to complete (no error toast) but nothing renders. Most likely cause: the ASR API response uses different field names than we expect (we read `res.text`, `res.language`, `res.duration`), so `result.text` is undefined and the card either doesn't render or renders empty.

Secondary suspects:
- `useServerFn` returning the value in a wrapper shape we aren't unpacking.
- Result is rendered but text is empty string (truthy-check passes but visually empty).

## Fix

Edit `src/routes/_authenticated/assigned-audits.tsx` and `src/lib/qip/transcribe.functions.ts`:

1. **Log the raw response** on the server (`console.log("ASR response keys:", Object.keys(json))`) and on the client (`console.log("transcribe result", res)`) so we can see the actual shape in the server-function logs + browser console next turn.

2. **Normalize the response** in `callAsr` — accept any of `text` / `transcript` / `transcription` / `segments[].text` joined, and map to a single `text` field before returning. Same for `language` (`language` / `detected_language`) and `duration` (`duration` / `audio_duration`).

3. **Always show the result card** once `result` is set, with:
   - The normalized transcript text
   - An "Empty transcript" placeholder if text is blank
   - A collapsible "Show raw JSON" `<details>` block dumping `JSON.stringify(result, null, 2)` so we can see exactly what came back

4. Keep error toast behavior; also `console.error` the full error.

No DB/auth changes. Once we see the real shape in logs/console, we lock the parser to the correct fields and remove the debug JSON block.
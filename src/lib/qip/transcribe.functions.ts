import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ASR_BASE = "https://asr-api-705962693516.asia-south1.run.app";

type TranscribeResult = {
  text: string;
  language?: string;
  language_probability?: number;
  duration?: number;
  segments?: Array<{ start: number; end: number; text: string }>;
};

async function callAsr(file: Blob, filename: string, opts: { language?: string; task?: string }): Promise<TranscribeResult> {
  const key = process.env.ASR_API_KEY;
  if (!key) throw new Error("ASR_API_KEY is not configured");
  const fd = new FormData();
  fd.append("file", file, filename);
  if (opts.language) fd.append("language", opts.language);
  if (opts.task) fd.append("task", opts.task);
  const res = await fetch(`${ASR_BASE}/v1/transcribe`, {
    method: "POST",
    headers: { "X-API-Key": key },
    body: fd,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Transcription failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json: any = await res.json();
  console.log("ASR raw response keys:", Object.keys(json ?? {}));
  const text =
    json?.text ??
    json?.transcript ??
    json?.transcription ??
    (Array.isArray(json?.segments) ? json.segments.map((s: any) => s?.text ?? "").join(" ").trim() : "") ??
    "";
  return {
    text: typeof text === "string" ? text : String(text ?? ""),
    language: json?.language ?? json?.detected_language,
    language_probability: json?.language_probability ?? json?.language_confidence,
    duration: json?.duration ?? json?.audio_duration,
    segments: json?.segments,
    // @ts-expect-error keep raw for debugging
    _raw: json,
  };
}

export const transcribeUpload = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!(input instanceof FormData)) throw new Error("Expected FormData");
    const file = input.get("file");
    if (!(file instanceof File)) throw new Error("Missing audio file");
    const language = (input.get("language") as string) || undefined;
    const task = (input.get("task") as string) || undefined;
    return { file, language, task };
  })
  .handler(async ({ data }) => {
    return callAsr(data.file, data.file.name || "audio", { language: data.language, task: data.task });
  });

export const transcribeUrl = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    const obj = input as { url?: string; language?: string; task?: string };
    if (!obj?.url || typeof obj.url !== "string") throw new Error("Missing url");
    try { new URL(obj.url); } catch { throw new Error("Invalid url"); }
    return { url: obj.url, language: obj.language, task: obj.task };
  })
  .handler(async ({ data }) => {
    const r = await fetch(data.url);
    if (!r.ok) throw new Error(`Could not fetch source URL (${r.status})`);
    const buf = await r.arrayBuffer();
    if (buf.byteLength > 25 * 1024 * 1024) throw new Error("File exceeds 25MB limit");
    const ct = r.headers.get("content-type") || "application/octet-stream";
    const name = data.url.split("/").pop()?.split("?")[0] || "audio";
    const blob = new Blob([buf], { type: ct });
    return callAsr(blob, name, { language: data.language, task: data.task });
  });

export const saveTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const o = input as any;
    if (!o || typeof o.transcript !== "string" || o.transcript.length === 0) throw new Error("Transcript is required");
    if (o.transcript.length > 200000) throw new Error("Transcript too large");
    if (o.source_type !== "url" && o.source_type !== "upload") throw new Error("Invalid source_type");
    return {
      transcript: o.transcript as string,
      language: typeof o.language === "string" ? o.language : null,
      duration_seconds: typeof o.duration === "number" ? o.duration : null,
      segments: o.segments ?? null,
      raw: o.raw ?? null,
      source_type: o.source_type as "url" | "upload",
      source_url: typeof o.source_url === "string" ? o.source_url : null,
      file_name: typeof o.file_name === "string" ? o.file_name : null,
    };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("call_transcripts")
      .insert({
        created_by: userId,
        transcript: data.transcript,
        language: data.language,
        duration_seconds: data.duration_seconds,
        segments: data.segments,
        raw: data.raw,
        source_type: data.source_type,
        source_url: data.source_url,
        file_name: data.file_name,
      })
      .select("id, expires_at")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id as string, expires_at: row.expires_at as string };
  });
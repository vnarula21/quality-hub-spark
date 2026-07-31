-- Chat audits are pasted conversation text (not a URL or an uploaded audio
-- file), so widen the source_type check constraint to allow 'paste'.
ALTER TABLE public.call_transcripts DROP CONSTRAINT call_transcripts_source_type_check;
ALTER TABLE public.call_transcripts ADD CONSTRAINT call_transcripts_source_type_check
  CHECK (source_type = ANY (ARRAY['url'::text, 'upload'::text, 'paste'::text]));

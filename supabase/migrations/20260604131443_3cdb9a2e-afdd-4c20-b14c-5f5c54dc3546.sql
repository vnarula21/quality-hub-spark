
CREATE TABLE public.call_transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL DEFAULT auth.uid(),
  coach_id uuid,
  audit_id uuid,
  source_type text NOT NULL CHECK (source_type IN ('url','upload')),
  source_url text,
  file_name text,
  language text,
  duration_seconds numeric,
  transcript text NOT NULL,
  segments jsonb,
  raw jsonb,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.call_transcripts TO authenticated;
GRANT ALL ON public.call_transcripts TO service_role;

ALTER TABLE public.call_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY call_transcripts_owner_all ON public.call_transcripts
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY call_transcripts_admin_all ON public.call_transcripts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE TRIGGER call_transcripts_touch_updated_at
  BEFORE UPDATE ON public.call_transcripts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX call_transcripts_created_by_idx ON public.call_transcripts(created_by);
CREATE INDEX call_transcripts_expires_at_idx ON public.call_transcripts(expires_at);

CREATE OR REPLACE FUNCTION public.purge_expired_call_transcripts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.call_transcripts WHERE expires_at < now();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END $$;

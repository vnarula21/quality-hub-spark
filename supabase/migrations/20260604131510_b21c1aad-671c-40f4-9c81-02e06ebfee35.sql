
REVOKE EXECUTE ON FUNCTION public.purge_expired_call_transcripts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_expired_call_transcripts() TO service_role;

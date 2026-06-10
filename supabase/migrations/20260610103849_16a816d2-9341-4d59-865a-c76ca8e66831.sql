
CREATE POLICY "Authenticated users can upload call recordings"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'call-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read their own call recordings"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'call-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own call recordings"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'call-recordings' AND (storage.foldername(name))[1] = auth.uid()::text);


-- Create bucket for training files
INSERT INTO storage.buckets (id, name, public)
VALUES ('training-files', 'training-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read training files" ON storage.objects
  FOR SELECT USING (bucket_id = 'training-files');

CREATE POLICY "Users upload own training files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own training files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own training files" ON storage.objects
  FOR DELETE USING (bucket_id = 'training-files' AND auth.uid()::text = (storage.foldername(name))[1]);

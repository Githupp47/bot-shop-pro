ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS external_id TEXT;
CREATE INDEX IF NOT EXISTS idx_conversations_user_channel_external ON public.conversations(user_id, channel, external_id);
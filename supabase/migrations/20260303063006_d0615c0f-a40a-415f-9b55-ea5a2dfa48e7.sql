
-- Enable pg_cron and pg_net for server-side alarm scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Table to store triggered alarms (server pushes, client listens via Realtime)
CREATE TABLE public.alarm_triggers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alarm_id UUID NOT NULL REFERENCES public.alarms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  triggered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  label TEXT,
  sound_id TEXT,
  captcha_type TEXT,
  captcha_difficulty INTEGER DEFAULT 2,
  gradual_volume BOOLEAN DEFAULT true,
  vibration BOOLEAN DEFAULT true,
  dismissed BOOLEAN DEFAULT false
);

-- Enable RLS
ALTER TABLE public.alarm_triggers ENABLE ROW LEVEL SECURITY;

-- Users can only see their own triggers
CREATE POLICY "Users can view their own alarm triggers"
ON public.alarm_triggers FOR SELECT
USING (auth.uid() = user_id);

-- Edge function inserts triggers (uses service role, bypasses RLS)
-- Users can update their own triggers (dismiss)
CREATE POLICY "Users can update their own alarm triggers"
ON public.alarm_triggers FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own old triggers
CREATE POLICY "Users can delete their own alarm triggers"
ON public.alarm_triggers FOR DELETE
USING (auth.uid() = user_id);

-- Enable Realtime for alarm_triggers
ALTER PUBLICATION supabase_realtime ADD TABLE public.alarm_triggers;

-- Auto-cleanup old triggers (older than 24h) to keep table clean
CREATE OR REPLACE FUNCTION public.cleanup_old_alarm_triggers()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.alarm_triggers
  WHERE triggered_at < now() - interval '24 hours';
$$;

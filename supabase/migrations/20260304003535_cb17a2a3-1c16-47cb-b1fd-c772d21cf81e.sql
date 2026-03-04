
-- Fix RLS policies to be PERMISSIVE (the default behavior)
DROP POLICY IF EXISTS "Users can view their own alarm triggers" ON public.alarm_triggers;
DROP POLICY IF EXISTS "Users can update their own alarm triggers" ON public.alarm_triggers;
DROP POLICY IF EXISTS "Users can delete their own alarm triggers" ON public.alarm_triggers;

CREATE POLICY "Users can view their own alarm triggers"
ON public.alarm_triggers FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alarm triggers"
ON public.alarm_triggers FOR UPDATE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alarm triggers"
ON public.alarm_triggers FOR DELETE TO authenticated
USING (auth.uid() = user_id);

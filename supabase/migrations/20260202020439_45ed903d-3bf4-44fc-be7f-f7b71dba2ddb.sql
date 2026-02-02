-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  sleep_goal_hours NUMERIC DEFAULT 8,
  preferred_wake_time TIME DEFAULT '07:00:00',
  preferred_bedtime TIME DEFAULT '23:00:00',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sleep_records table for tracking sleep sessions
CREATE TABLE public.sleep_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  sleep_score INTEGER CHECK (sleep_score >= 0 AND sleep_score <= 100),
  notes TEXT,
  is_tracking BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sleep_stages table for sleep cycle breakdown
CREATE TABLE public.sleep_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sleep_record_id UUID REFERENCES public.sleep_records(id) ON DELETE CASCADE NOT NULL,
  stage_type TEXT NOT NULL CHECK (stage_type IN ('deep', 'light', 'rem', 'awake')),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create noise_events table for snoring/talking detection
CREATE TABLE public.noise_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sleep_record_id UUID REFERENCES public.sleep_records(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('snoring', 'talking', 'movement', 'other')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_seconds INTEGER,
  intensity INTEGER CHECK (intensity >= 0 AND intensity <= 100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dreams table for dream diary
CREATE TABLE public.dreams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sleep_record_id UUID REFERENCES public.sleep_records(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'neutral', 'scary', 'sad', 'exciting', 'peaceful')),
  is_lucid BOOLEAN DEFAULT false,
  clarity INTEGER DEFAULT 3 CHECK (clarity >= 1 AND clarity <= 5),
  tags TEXT[] DEFAULT '{}',
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create alarms table for smart alarm settings
CREATE TABLE public.alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  time TIME NOT NULL,
  label TEXT DEFAULT 'Alarm',
  enabled BOOLEAN DEFAULT true,
  days_of_week INTEGER[] DEFAULT '{1,2,3,4,5}', -- 0=Sun, 1=Mon, etc.
  wake_window_minutes INTEGER DEFAULT 30,
  captcha_enabled BOOLEAN DEFAULT true,
  captcha_type TEXT DEFAULT 'math' CHECK (captcha_type IN ('math', 'memory', 'typing', 'shake')),
  captcha_difficulty INTEGER DEFAULT 2 CHECK (captcha_difficulty >= 1 AND captcha_difficulty <= 3),
  sound_id TEXT DEFAULT 'sunrise',
  gradual_volume BOOLEAN DEFAULT true,
  vibration BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sound_presets table for saved sound mixes
CREATE TABLE public.sound_presets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  sounds JSONB NOT NULL DEFAULT '[]', -- Array of {sound: string, volume: number}
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_settings table for app preferences
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  notifications_enabled BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT true,
  anti_snore_enabled BOOLEAN DEFAULT true,
  noise_recording_enabled BOOLEAN DEFAULT false,
  smart_wake_enabled BOOLEAN DEFAULT true,
  data_sync_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.noise_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sound_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for sleep_records
CREATE POLICY "Users can view their own sleep records" ON public.sleep_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sleep records" ON public.sleep_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sleep records" ON public.sleep_records
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sleep records" ON public.sleep_records
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sleep_stages (via sleep_record ownership)
CREATE POLICY "Users can view sleep stages for their records" ON public.sleep_stages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sleep_records WHERE id = sleep_stages.sleep_record_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert sleep stages for their records" ON public.sleep_stages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.sleep_records WHERE id = sleep_stages.sleep_record_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete sleep stages for their records" ON public.sleep_stages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.sleep_records WHERE id = sleep_stages.sleep_record_id AND user_id = auth.uid())
  );

-- RLS Policies for noise_events (via sleep_record ownership)
CREATE POLICY "Users can view noise events for their records" ON public.noise_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.sleep_records WHERE id = noise_events.sleep_record_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can insert noise events for their records" ON public.noise_events
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.sleep_records WHERE id = noise_events.sleep_record_id AND user_id = auth.uid())
  );
CREATE POLICY "Users can delete noise events for their records" ON public.noise_events
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.sleep_records WHERE id = noise_events.sleep_record_id AND user_id = auth.uid())
  );

-- RLS Policies for dreams
CREATE POLICY "Users can view their own dreams" ON public.dreams
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own dreams" ON public.dreams
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own dreams" ON public.dreams
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own dreams" ON public.dreams
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for alarms
CREATE POLICY "Users can view their own alarms" ON public.alarms
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own alarms" ON public.alarms
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own alarms" ON public.alarms
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own alarms" ON public.alarms
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for sound_presets
CREATE POLICY "Users can view their own sound presets" ON public.sound_presets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sound presets" ON public.sound_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sound presets" ON public.sound_presets
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sound presets" ON public.sound_presets
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for user_settings
CREATE POLICY "Users can view their own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sleep_records_updated_at
  BEFORE UPDATE ON public.sleep_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dreams_updated_at
  BEFORE UPDATE ON public.dreams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_alarms_updated_at
  BEFORE UPDATE ON public.alarms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile and settings on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better query performance
CREATE INDEX idx_sleep_records_user_id ON public.sleep_records(user_id);
CREATE INDEX idx_sleep_records_start_time ON public.sleep_records(start_time);
CREATE INDEX idx_sleep_stages_sleep_record_id ON public.sleep_stages(sleep_record_id);
CREATE INDEX idx_noise_events_sleep_record_id ON public.noise_events(sleep_record_id);
CREATE INDEX idx_dreams_user_id ON public.dreams(user_id);
CREATE INDEX idx_dreams_date ON public.dreams(date);
CREATE INDEX idx_alarms_user_id ON public.alarms(user_id);
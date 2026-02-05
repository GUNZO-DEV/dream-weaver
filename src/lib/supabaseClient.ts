 import { createClient } from '@supabase/supabase-js';
 import { Capacitor } from '@capacitor/core';
 import { capacitorStorage } from './capacitorStorage';
 import type { Database } from '@/integrations/supabase/types';
 
 const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
 const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
 
 const isNative = Capacitor.isNativePlatform();
 
 /**
 * Native-compatible Supabase client
 * Uses Capacitor Preferences for session storage on iOS/Android
 * Disables URL session detection for native builds (no browser redirects)
 */
 export const nativeSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
   auth: {
     storage: capacitorStorage,
     persistSession: true,
     autoRefreshToken: true,
     detectSessionInUrl: !isNative, // Disable for native, enable for web
   }
 });
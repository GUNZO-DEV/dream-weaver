import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase as webSupabase } from '@/integrations/supabase/client';
 import { nativeSupabase } from '@/lib/supabaseClient';
 import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';

type UserSettings = Tables<'user_settings'>;
type UserSettingsUpdate = TablesUpdate<'user_settings'>;

 // Use native client on iOS/Android, web client on browser
 const getClient = () => Capacitor.isNativePlatform() ? nativeSupabase : webSupabase;
 
export const useUserSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user settings
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['user_settings', user?.id],
    queryFn: async () => {
      if (!user) return null;
       const { data, error } = await getClient()
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update settings
  const updateSettings = useMutation({
    mutationFn: async (updates: Omit<UserSettingsUpdate, 'user_id' | 'id'>) => {
      if (!user) throw new Error('User not authenticated');
       const { data, error } = await getClient()
        .from('user_settings')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_settings'] });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  };
};

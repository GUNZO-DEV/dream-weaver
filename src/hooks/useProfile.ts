import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase as webSupabase } from '@/integrations/supabase/client';
 import { nativeSupabase } from '@/lib/supabaseClient';
 import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesUpdate } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

 // Use native client on iOS/Android, web client on browser
 const getClient = () => Capacitor.isNativePlatform() ? nativeSupabase : webSupabase;
 
export const useProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user profile
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
       const { data, error } = await getClient()
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Update profile
  const updateProfile = useMutation({
    mutationFn: async (updates: Omit<ProfileUpdate, 'user_id' | 'id'>) => {
      if (!user) throw new Error('User not authenticated');
       const { data, error } = await getClient()
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  return {
    profile,
    isLoading,
    error,
    updateProfile,
  };
};

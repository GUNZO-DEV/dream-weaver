import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
 import { supabase as webSupabase } from '@/integrations/supabase/client';
 import { nativeSupabase } from '@/lib/supabaseClient';
 import { Capacitor } from '@capacitor/core';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Alarm = Tables<'alarms'>;
type AlarmInsert = TablesInsert<'alarms'>;
type AlarmUpdate = TablesUpdate<'alarms'>;

 // Use native client on iOS/Android, web client on browser
 const getClient = () => {
   const isNative = Capacitor.isNativePlatform();
   console.log('[useAlarms] getClient - isNative:', isNative);
   return isNative ? nativeSupabase : webSupabase;
 };
 
export const useAlarms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all alarms for the current user
  const { data: alarms, isLoading, error } = useQuery({
    queryKey: ['alarms', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('[useAlarms] No user, returning empty array');
        return [];
      }
      console.log('[useAlarms] Fetching alarms for user:', user.id);
       const { data, error } = await getClient()
        .from('alarms')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: true });
      if (error) {
        console.error('[useAlarms] Error fetching alarms:', error);
        throw error;
      }
      console.log('[useAlarms] Fetched', data?.length ?? 0, 'alarms');
      return data;
    },
    enabled: !!user,
  });

  // Add a new alarm
  const addAlarm = useMutation({
    mutationFn: async (alarm: Omit<AlarmInsert, 'user_id'>) => {
      if (!user) {
        console.error('[useAlarms] Cannot add alarm - user not authenticated');
        throw new Error('User not authenticated');
      }
      console.log('[useAlarms] Adding alarm for user:', user.id);
       const { data, error } = await getClient()
        .from('alarms')
        .insert({ ...alarm, user_id: user.id })
        .select()
        .single();
      if (error) {
        console.error('[useAlarms] Error adding alarm:', error);
        throw error;
      }
      console.log('[useAlarms] Alarm added:', data?.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
  });

  // Update an alarm
  const updateAlarm = useMutation({
    mutationFn: async ({ id, ...updates }: AlarmUpdate & { id: string }) => {
       const { data, error } = await getClient()
        .from('alarms')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
  });

  // Delete an alarm
  const deleteAlarm = useMutation({
    mutationFn: async (id: string) => {
       const { error } = await getClient()
        .from('alarms')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
  });

  // Toggle alarm enabled state
  const toggleAlarm = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
       const { data, error } = await getClient()
        .from('alarms')
        .update({ enabled })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
  });

  return {
    alarms,
    isLoading,
    error,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
  };
};

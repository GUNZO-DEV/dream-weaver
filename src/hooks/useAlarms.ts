import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Alarm = Tables<'alarms'>;
type AlarmInsert = TablesInsert<'alarms'>;
type AlarmUpdate = TablesUpdate<'alarms'>;

export const useAlarms = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all alarms for the current user
  const { data: alarms, isLoading, error } = useQuery({
    queryKey: ['alarms', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('alarms')
        .select('*')
        .eq('user_id', user.id)
        .order('time', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Add a new alarm
  const addAlarm = useMutation({
    mutationFn: async (alarm: Omit<AlarmInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('alarms')
        .insert({ ...alarm, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alarms'] });
    },
  });

  // Update an alarm
  const updateAlarm = useMutation({
    mutationFn: async ({ id, ...updates }: AlarmUpdate & { id: string }) => {
      const { data, error } = await supabase
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
      const { error } = await supabase
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
      const { data, error } = await supabase
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

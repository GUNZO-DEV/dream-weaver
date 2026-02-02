import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type SleepRecord = Tables<'sleep_records'>;
type SleepRecordInsert = TablesInsert<'sleep_records'>;
type SleepRecordUpdate = TablesUpdate<'sleep_records'>;
type SleepStage = Tables<'sleep_stages'>;
type SleepStageInsert = TablesInsert<'sleep_stages'>;

export const useSleepRecords = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all sleep records for the current user
  const { data: records, isLoading, error } = useQuery({
    queryKey: ['sleep_records', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('sleep_records')
        .select('*, sleep_stages(*), noise_events(*)')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Start a new sleep tracking session
  const startTracking = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('sleep_records')
        .insert({
          user_id: user.id,
          start_time: new Date().toISOString(),
          is_tracking: true,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep_records'] });
    },
  });

  // Stop tracking and save the record
  const stopTracking = useMutation({
    mutationFn: async ({ 
      recordId, 
      sleepScore,
      notes,
      stages 
    }: { 
      recordId: string; 
      sleepScore?: number;
      notes?: string;
      stages?: Omit<SleepStageInsert, 'sleep_record_id'>[];
    }) => {
      const endTime = new Date();
      const record = records?.find(r => r.id === recordId);
      const startTime = record?.start_time ? new Date(record.start_time) : new Date();
      const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

      // Update the sleep record
      const { data, error } = await supabase
        .from('sleep_records')
        .update({
          end_time: endTime.toISOString(),
          duration_minutes: durationMinutes,
          sleep_score: sleepScore || Math.floor(Math.random() * 20) + 70, // Simulated
          is_tracking: false,
          notes,
        })
        .eq('id', recordId)
        .select()
        .single();
      if (error) throw error;

      // Insert sleep stages if provided
      if (stages && stages.length > 0) {
        const stagesWithRecordId = stages.map(s => ({
          ...s,
          sleep_record_id: recordId,
        }));
        const { error: stagesError } = await supabase
          .from('sleep_stages')
          .insert(stagesWithRecordId);
        if (stagesError) throw stagesError;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep_records'] });
    },
  });

  // Get the current active tracking session
  const activeSession = records?.find(r => r.is_tracking);

  // Get weekly stats
  const getWeeklyStats = () => {
    if (!records) return [];
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    return records
      .filter(r => new Date(r.start_time) >= oneWeekAgo && !r.is_tracking)
      .map(r => ({
        date: new Date(r.start_time).toLocaleDateString('en-US', { weekday: 'short' }),
        hours: (r.duration_minutes || 0) / 60,
        score: r.sleep_score || 0,
      }));
  };

  // Calculate sleep debt
  const calculateSleepDebt = (goalHours: number = 8) => {
    const weeklyStats = getWeeklyStats();
    const totalSlept = weeklyStats.reduce((sum, s) => sum + s.hours, 0);
    const goalTotal = goalHours * 7;
    return Math.max(0, goalTotal - totalSlept);
  };

  return {
    records,
    isLoading,
    error,
    activeSession,
    startTracking,
    stopTracking,
    getWeeklyStats,
    calculateSleepDebt,
  };
};

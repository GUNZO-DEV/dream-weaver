import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Dream = Tables<'dreams'>;
type DreamInsert = TablesInsert<'dreams'>;
type DreamUpdate = TablesUpdate<'dreams'>;

export const useDreams = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all dreams for the current user
  const { data: dreams, isLoading, error } = useQuery({
    queryKey: ['dreams', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('dreams')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Add a new dream
  const addDream = useMutation({
    mutationFn: async (dream: Omit<DreamInsert, 'user_id'>) => {
      if (!user) throw new Error('User not authenticated');
      const { data, error } = await supabase
        .from('dreams')
        .insert({ ...dream, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dreams'] });
    },
  });

  // Update a dream
  const updateDream = useMutation({
    mutationFn: async ({ id, ...updates }: DreamUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('dreams')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dreams'] });
    },
  });

  // Delete a dream
  const deleteDream = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('dreams')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dreams'] });
    },
  });

  // Get all unique tags
  const getAllTags = () => {
    if (!dreams) return [];
    const tagSet = new Set<string>();
    dreams.forEach(dream => {
      dream.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet);
  };

  // Get lucid dreams count
  const getLucidDreamsCount = () => {
    return dreams?.filter(d => d.is_lucid).length || 0;
  };

  // Search dreams
  const searchDreams = (query: string) => {
    if (!dreams || !query) return dreams || [];
    const lowerQuery = query.toLowerCase();
    return dreams.filter(dream =>
      dream.title.toLowerCase().includes(lowerQuery) ||
      dream.description?.toLowerCase().includes(lowerQuery) ||
      dream.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  return {
    dreams,
    isLoading,
    error,
    addDream,
    updateDream,
    deleteDream,
    getAllTags,
    getLucidDreamsCount,
    searchDreams,
  };
};

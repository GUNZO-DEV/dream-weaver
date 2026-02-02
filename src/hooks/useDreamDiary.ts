import { useState, useEffect, useCallback } from 'react';

export interface DreamEntry {
  id: string;
  date: Date;
  title: string;
  description: string;
  mood: 'happy' | 'neutral' | 'scary' | 'sad' | 'exciting' | 'peaceful';
  isLucid: boolean;
  tags: string[];
  clarity: number; // 1-5
  sleepRecordId?: string;
}

const STORAGE_KEY = 'dreamDiary';

export const useDreamDiary = () => {
  const [entries, setEntries] = useState<DreamEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved).map((e: any) => ({
        ...e,
        date: new Date(e.date),
      }));
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const addEntry = useCallback((entry: Omit<DreamEntry, 'id'>) => {
    const newEntry: DreamEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const updateEntry = useCallback((id: string, updates: Partial<DreamEntry>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, ...updates } : entry
    ));
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  }, []);

  const searchEntries = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase();
    return entries.filter(entry =>
      entry.title.toLowerCase().includes(lowerQuery) ||
      entry.description.toLowerCase().includes(lowerQuery) ||
      entry.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }, [entries]);

  const getEntriesByTag = useCallback((tag: string) => {
    return entries.filter(entry => entry.tags.includes(tag));
  }, [entries]);

  const getLucidDreams = useCallback(() => {
    return entries.filter(entry => entry.isLucid);
  }, [entries]);

  const getAllTags = useCallback(() => {
    const tagSet = new Set<string>();
    entries.forEach(entry => entry.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet);
  }, [entries]);

  return {
    entries,
    addEntry,
    updateEntry,
    deleteEntry,
    searchEntries,
    getEntriesByTag,
    getLucidDreams,
    getAllTags,
  };
};

export const moodEmojis: Record<DreamEntry['mood'], string> = {
  happy: '😊',
  neutral: '😐',
  scary: '😨',
  sad: '😢',
  exciting: '🤩',
  peaceful: '😌',
};

export const moodLabels: Record<DreamEntry['mood'], string> = {
  happy: 'Happy',
  neutral: 'Neutral',
  scary: 'Scary',
  sad: 'Sad',
  exciting: 'Exciting',
  peaceful: 'Peaceful',
};

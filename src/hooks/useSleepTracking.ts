import { useState, useEffect, useCallback, useRef } from 'react';

export interface SleepRecord {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration: number; // in minutes
  stages: SleepStage[];
  noiseEvents: NoiseEvent[];
  sleepScore: number;
  notes: string;
}

export interface SleepStage {
  type: 'deep' | 'light' | 'rem' | 'awake';
  startMinute: number;
  duration: number;
}

export interface NoiseEvent {
  timestamp: Date;
  type: 'snoring' | 'talking' | 'movement';
  intensity: number; // 0-100
}

interface SleepTrackingState {
  isTracking: boolean;
  startTime: Date | null;
  currentDuration: number; // in seconds
  currentStage: 'deep' | 'light' | 'rem' | 'awake';
  motionLevel: number; // 0-100
  noiseLevel: number; // 0-100
}

const initialState: SleepTrackingState = {
  isTracking: false,
  startTime: null,
  currentDuration: 0,
  currentStage: 'light',
  motionLevel: 0,
  noiseLevel: 0,
};

export const useSleepTracking = () => {
  const [state, setState] = useState<SleepTrackingState>(() => {
    const saved = localStorage.getItem('sleepTrackingState');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.startTime) {
        parsed.startTime = new Date(parsed.startTime);
      }
      return parsed;
    }
    return initialState;
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const stageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('sleepTrackingState', JSON.stringify(state));
  }, [state]);

  // Update duration timer
  useEffect(() => {
    if (state.isTracking && state.startTime) {
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - state.startTime!.getTime()) / 1000);
        setState(prev => ({ ...prev, currentDuration: diffSeconds }));
      }, 1000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [state.isTracking, state.startTime]);

  // Simulate sleep stage changes and motion/noise
  useEffect(() => {
    if (state.isTracking) {
      stageIntervalRef.current = setInterval(() => {
        const stages: Array<'deep' | 'light' | 'rem' | 'awake'> = ['light', 'deep', 'rem', 'light', 'deep', 'rem'];
        const randomStage = stages[Math.floor(Math.random() * stages.length)];
        const randomMotion = Math.floor(Math.random() * 40);
        const randomNoise = Math.floor(Math.random() * 30);
        
        setState(prev => ({
          ...prev,
          currentStage: Math.random() > 0.7 ? randomStage : prev.currentStage,
          motionLevel: randomMotion,
          noiseLevel: randomNoise,
        }));
      }, 5000);

      return () => {
        if (stageIntervalRef.current) clearInterval(stageIntervalRef.current);
      };
    }
  }, [state.isTracking]);

  const startTracking = useCallback(() => {
    setState({
      isTracking: true,
      startTime: new Date(),
      currentDuration: 0,
      currentStage: 'awake',
      motionLevel: 50,
      noiseLevel: 10,
    });
  }, []);

  const stopTracking = useCallback((): SleepRecord => {
    const endTime = new Date();
    const duration = state.startTime 
      ? Math.floor((endTime.getTime() - state.startTime.getTime()) / 60000)
      : 0;

    // Generate simulated sleep stages
    const stages: SleepStage[] = [];
    let currentMinute = 0;
    const stageTypes: Array<'light' | 'deep' | 'rem' | 'awake'> = ['light', 'deep', 'rem', 'light', 'deep', 'rem', 'light'];
    
    for (const type of stageTypes) {
      const stageDuration = Math.floor(duration / stageTypes.length) + Math.floor(Math.random() * 10);
      if (currentMinute < duration) {
        stages.push({
          type,
          startMinute: currentMinute,
          duration: Math.min(stageDuration, duration - currentMinute),
        });
        currentMinute += stageDuration;
      }
    }

    const record: SleepRecord = {
      id: Date.now().toString(),
      startTime: state.startTime || new Date(),
      endTime,
      duration,
      stages,
      noiseEvents: [],
      sleepScore: Math.floor(70 + Math.random() * 25),
      notes: '',
    };

    // Save to history
    const history = JSON.parse(localStorage.getItem('sleepHistory') || '[]');
    history.unshift(record);
    localStorage.setItem('sleepHistory', JSON.stringify(history.slice(0, 30)));

    // Reset state
    setState(initialState);
    localStorage.removeItem('sleepTrackingState');

    return record;
  }, [state.startTime]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    ...state,
    startTracking,
    stopTracking,
    formatDuration,
  };
};

export const getSleepHistory = (): SleepRecord[] => {
  const history = localStorage.getItem('sleepHistory');
  if (!history) return [];
  
  return JSON.parse(history).map((record: any) => ({
    ...record,
    startTime: new Date(record.startTime),
    endTime: record.endTime ? new Date(record.endTime) : null,
  }));
};

export const getSleepDebt = (): number => {
  const targetHours = 8;
  const history = getSleepHistory().slice(0, 7);
  if (history.length === 0) return 0;
  
  const totalTarget = targetHours * history.length * 60;
  const totalSlept = history.reduce((acc, record) => acc + record.duration, 0);
  
  return Math.max(0, totalTarget - totalSlept);
};

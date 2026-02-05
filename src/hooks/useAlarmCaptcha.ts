import { useState, useCallback } from 'react';
 import { Capacitor } from '@capacitor/core';
 import { Preferences } from '@capacitor/preferences';
 
 const isNative = Capacitor.isNativePlatform();
 
 const storageGet = async (key: string): Promise<string | null> => {
   if (isNative) {
     const { value } = await Preferences.get({ key });
     return value;
   }
   return localStorage.getItem(key);
 };
 
 const storageSet = async (key: string, value: string): Promise<void> => {
   if (isNative) {
     await Preferences.set({ key, value });
   } else {
     localStorage.setItem(key, value);
   }
 };

export type CaptchaType = 'math' | 'shake' | 'barcode' | 'memory' | 'typing';

export interface CaptchaChallenge {
  type: CaptchaType;
  question: string;
  answer: string;
  difficulty: number; // 1-3
}

export interface AlarmSettings {
  captchaEnabled: boolean;
  captchaType: CaptchaType;
  captchaDifficulty: number;
  snoozeLimit: number;
  snoozeDuration: number;
  gradualVolume: boolean;
  vibration: boolean;
}

const defaultSettings: AlarmSettings = {
  captchaEnabled: true,
  captchaType: 'math',
  captchaDifficulty: 2,
  snoozeLimit: 3,
  snoozeDuration: 5,
  gradualVolume: true,
  vibration: true,
};

export const useAlarmCaptcha = () => {
   const [settings, setSettings] = useState<AlarmSettings>(defaultSettings);
   const [isLoaded, setIsLoaded] = useState(false);

  const [currentChallenge, setCurrentChallenge] = useState<CaptchaChallenge | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [isAlarmActive, setIsAlarmActive] = useState(false);

   // Load settings from storage on mount
   useState(() => {
     storageGet('alarmSettings').then(saved => {
       if (saved) {
         setSettings(JSON.parse(saved));
       }
       setIsLoaded(true);
     });
   });
 
  const saveSettings = useCallback((newSettings: Partial<AlarmSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
     storageSet('alarmSettings', JSON.stringify(updated));
  }, [settings]);

  const generateMathChallenge = (difficulty: number): CaptchaChallenge => {
    let a: number, b: number, operation: string, answer: number;
    
    switch (difficulty) {
      case 1:
        a = Math.floor(Math.random() * 10) + 1;
        b = Math.floor(Math.random() * 10) + 1;
        operation = '+';
        answer = a + b;
        break;
      case 2:
        a = Math.floor(Math.random() * 20) + 10;
        b = Math.floor(Math.random() * 10) + 1;
        operation = Math.random() > 0.5 ? '+' : '-';
        answer = operation === '+' ? a + b : a - b;
        break;
      case 3:
      default:
        a = Math.floor(Math.random() * 15) + 5;
        b = Math.floor(Math.random() * 10) + 2;
        const ops = ['+', '-', '×'];
        operation = ops[Math.floor(Math.random() * ops.length)];
        if (operation === '+') answer = a + b;
        else if (operation === '-') answer = a - b;
        else answer = a * b;
        break;
    }

    return {
      type: 'math',
      question: `${a} ${operation} ${b} = ?`,
      answer: answer.toString(),
      difficulty,
    };
  };

  const generateShakeChallenge = (difficulty: number): CaptchaChallenge => {
    const shakeCount = difficulty * 10 + 10;
    return {
      type: 'shake',
      question: `Shake your phone ${shakeCount} times`,
      answer: shakeCount.toString(),
      difficulty,
    };
  };

  const generateMemoryChallenge = (difficulty: number): CaptchaChallenge => {
    const length = difficulty + 3;
    const sequence = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
    return {
      type: 'memory',
      question: `Remember: ${sequence}`,
      answer: sequence,
      difficulty,
    };
  };

  const generateTypingChallenge = (difficulty: number): CaptchaChallenge => {
    const phrases = {
      1: ['I am awake', 'Good morning', 'Rise and shine'],
      2: ['I am fully awake now', 'Time to start the day', 'No more snoozing'],
      3: ['I promise to get out of bed right now', 'Sleep is for the weak and I am strong', 'Carpe diem my friend'],
    };
    const phrase = phrases[difficulty as 1 | 2 | 3][Math.floor(Math.random() * 3)];
    return {
      type: 'typing',
      question: `Type: "${phrase}"`,
      answer: phrase.toLowerCase().replace(/[^a-z0-9\s]/g, ''),
      difficulty,
    };
  };

  const generateChallenge = useCallback((): CaptchaChallenge => {
    switch (settings.captchaType) {
      case 'math':
        return generateMathChallenge(settings.captchaDifficulty);
      case 'shake':
        return generateShakeChallenge(settings.captchaDifficulty);
      case 'memory':
        return generateMemoryChallenge(settings.captchaDifficulty);
      case 'typing':
        return generateTypingChallenge(settings.captchaDifficulty);
      default:
        return generateMathChallenge(settings.captchaDifficulty);
    }
  }, [settings.captchaType, settings.captchaDifficulty]);

  const startAlarm = useCallback(() => {
    setIsAlarmActive(true);
    if (settings.captchaEnabled) {
      setCurrentChallenge(generateChallenge());
    }
    setAttempts(0);
  }, [settings.captchaEnabled, generateChallenge]);

  const submitAnswer = useCallback((answer: string): boolean => {
    if (!currentChallenge) return false;
    
    const isCorrect = answer.toLowerCase().trim() === currentChallenge.answer.toLowerCase();
    
    if (isCorrect) {
      setIsAlarmActive(false);
      setCurrentChallenge(null);
      setAttempts(0);
      return true;
    } else {
      setAttempts(prev => prev + 1);
      // Generate new challenge after 3 wrong attempts
      if (attempts >= 2) {
        setCurrentChallenge(generateChallenge());
        setAttempts(0);
      }
      return false;
    }
  }, [currentChallenge, attempts, generateChallenge]);

  const dismissAlarm = useCallback(() => {
    if (!settings.captchaEnabled) {
      setIsAlarmActive(false);
      return true;
    }
    return false;
  }, [settings.captchaEnabled]);

  return {
    settings,
    saveSettings,
    currentChallenge,
    isAlarmActive,
    attempts,
    startAlarm,
    submitAnswer,
    dismissAlarm,
    generateChallenge,
  };
};

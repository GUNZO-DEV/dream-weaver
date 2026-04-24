 import { useRef, useCallback, useEffect } from 'react';
 import { Capacitor } from '@capacitor/core';
 
 export type AlarmSoundType = 
   | 'sunrise' 
   | 'gentle' 
   | 'classic' 
   | 'digital' 
   | 'birds' 
   | 'ocean' 
   | 'chimes' 
   | 'radar';
 
 interface AlarmSoundConfig {
   frequency: number;
   type: OscillatorType;
   pattern: number[]; // [on, off] durations in ms
   modulationFreq?: number;
   modulationDepth?: number;
 }
 
 const ALARM_SOUNDS: Record<AlarmSoundType, AlarmSoundConfig> = {
   sunrise: {
     frequency: 440,
     type: 'sine',
     pattern: [500, 200, 500, 200, 500, 500],
     modulationFreq: 2,
     modulationDepth: 50,
   },
   gentle: {
     frequency: 523.25, // C5
     type: 'sine',
     pattern: [800, 400, 800, 400],
     modulationFreq: 1,
     modulationDepth: 30,
   },
   classic: {
     frequency: 880,
     type: 'square',
     pattern: [200, 200],
   },
   digital: {
     frequency: 1000,
     type: 'square',
     pattern: [100, 100, 100, 100, 100, 300],
   },
   birds: {
     frequency: 1200,
     type: 'sine',
     pattern: [150, 100, 200, 150, 100, 400],
     modulationFreq: 8,
     modulationDepth: 300,
   },
   ocean: {
     frequency: 200,
     type: 'sine',
     pattern: [1000, 500],
     modulationFreq: 0.3,
     modulationDepth: 100,
   },
   chimes: {
     frequency: 659.25, // E5
     type: 'sine',
     pattern: [400, 200, 300, 200, 500, 400],
     modulationFreq: 0.5,
     modulationDepth: 20,
   },
   radar: {
     frequency: 1500,
     type: 'sine',
     pattern: [100, 900],
   },
 };
 
 export const useAlarmSound = () => {
   const audioContextRef = useRef<AudioContext | null>(null);
   const oscillatorRef = useRef<OscillatorNode | null>(null);
   const gainNodeRef = useRef<GainNode | null>(null);
   const lfoRef = useRef<OscillatorNode | null>(null);
   const lfoGainRef = useRef<GainNode | null>(null);
   const patternIntervalRef = useRef<NodeJS.Timeout | null>(null);
   const isPlayingRef = useRef(false);
   const gradualVolumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
 
   const getAudioContext = useCallback((): AudioContext => {
     if (!audioContextRef.current) {
       const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
       if (!AudioContextClass) {
         throw new Error('AudioContext not supported');
       }
       audioContextRef.current = new AudioContextClass();
       console.log('[AlarmSound] Created AudioContext, state:', audioContextRef.current.state);
     }
     return audioContextRef.current;
   }, []);
 
  const resumeContext = useCallback(async (): Promise<AudioContext> => {
     const ctx = getAudioContext();
     if (ctx.state === 'suspended') {
       console.log('[AlarmSound] Resuming suspended AudioContext...');
      try {
        await ctx.resume();
      } catch (e) {
        console.error('[AlarmSound] Failed to resume context:', e);
      }
       console.log('[AlarmSound] AudioContext resumed, state:', ctx.state);
     }
     return ctx;
   }, [getAudioContext]);
 
   const stopAlarm = useCallback(() => {
     console.log('[AlarmSound] Stopping alarm');
     isPlayingRef.current = false;
 
     if (patternIntervalRef.current) {
       clearInterval(patternIntervalRef.current);
       patternIntervalRef.current = null;
     }
 
     if (gradualVolumeIntervalRef.current) {
       clearInterval(gradualVolumeIntervalRef.current);
       gradualVolumeIntervalRef.current = null;
     }
 
     if (oscillatorRef.current) {
       try {
         oscillatorRef.current.stop();
         oscillatorRef.current.disconnect();
       } catch (e) {
         // Already stopped
       }
       oscillatorRef.current = null;
     }
 
     if (lfoRef.current) {
       try {
         lfoRef.current.stop();
         lfoRef.current.disconnect();
       } catch (e) {
         // Already stopped
       }
       lfoRef.current = null;
     }
 
     if (gainNodeRef.current) {
       gainNodeRef.current.disconnect();
       gainNodeRef.current = null;
     }
 
     if (lfoGainRef.current) {
       lfoGainRef.current.disconnect();
       lfoGainRef.current = null;
     }
   }, []);
 
  // Internal: actually build the Web Audio graph for a given config.
  // Returns true on success, false on failure (caller decides on fallback).
  const playWithConfig = useCallback(async (
    soundType: AlarmSoundType,
    config: AlarmSoundConfig,
    gradualVolume: boolean,
    vibration: boolean,
  ): Promise<boolean> => {
    try {
      console.log('[AlarmSound] Playing alarm:', soundType, { gradualVolume, vibration });

      stopAlarm();

      const ctx = await resumeContext();

      if (ctx.state !== 'running') {
        console.warn('[AlarmSound] AudioContext not running after resume, state:', ctx.state);
        await ctx.resume();
      }
      if (ctx.state !== 'running') {
        throw new Error(`AudioContext stuck in state '${ctx.state}'`);
      }

      isPlayingRef.current = true;

      const oscillator = ctx.createOscillator();
      oscillator.type = config.type;
      oscillator.frequency.value = config.frequency;
      oscillatorRef.current = oscillator;

      const gainNode = ctx.createGain();
      gainNode.gain.value = gradualVolume ? 0.1 : 0.5;
      gainNodeRef.current = gainNode;

      if (config.modulationFreq && config.modulationDepth) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = config.modulationFreq;
        lfoRef.current = lfo;

        const lfoGain = ctx.createGain();
        lfoGain.gain.value = config.modulationDepth;
        lfoGainRef.current = lfoGain;

        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        lfo.start();
      }

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();

      console.log('[AlarmSound] Oscillator started');

      if (vibration && Capacitor.isNativePlatform()) {
        const vibratePattern = () => {
          if (!isPlayingRef.current) return;
          if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500, 500]);
          }
          setTimeout(vibratePattern, 2500);
        };
        vibratePattern();
      }

      let patternIndex = 0;
      let isOn = true;

      const runPattern = () => {
        if (!isPlayingRef.current) return;

        const duration = config.pattern[patternIndex % config.pattern.length];

        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = isOn ? (gradualVolume ? gainNodeRef.current.gain.value : 0.3) : 0;
        }

        if (isOn && vibration && Capacitor.isNativePlatform() && navigator.vibrate) {
          navigator.vibrate(duration);
        }

        isOn = !isOn;
        patternIndex++;

        patternIntervalRef.current = setTimeout(runPattern, duration);
      };

      runPattern();

      if (gradualVolume) {
        let currentVolume = 0.1;
        const targetVolume = 0.6;
        const steps = 30;
        const interval = 1000;
        const volumeStep = (targetVolume - currentVolume) / steps;

        gradualVolumeIntervalRef.current = setInterval(() => {
          if (!isPlayingRef.current) {
            if (gradualVolumeIntervalRef.current) {
              clearInterval(gradualVolumeIntervalRef.current);
            }
            return;
          }

          currentVolume = Math.min(currentVolume + volumeStep, targetVolume);
          if (gainNodeRef.current) {
            gainNodeRef.current.gain.value = Math.min(currentVolume, targetVolume);
          }

          if (currentVolume >= targetVolume && gradualVolumeIntervalRef.current) {
            clearInterval(gradualVolumeIntervalRef.current);
          }
        }, interval);
      }

      return true;
    } catch (error) {
      console.error('[AlarmSound] playWithConfig failed for', soundType, error);
      return false;
    }
  }, [stopAlarm, resumeContext]);

  /**
   * Play the alarm with the requested sound. If it fails, automatically
   * fall back to the simplest synthesized 'classic' beeper.
   */
  const playAlarm = useCallback(async (
    soundType: AlarmSoundType = 'sunrise',
    gradualVolume: boolean = true,
    vibration: boolean = true,
  ): Promise<{ ok: boolean; fellBack: boolean; reason?: string }> => {
    const primaryConfig = ALARM_SOUNDS[soundType] || ALARM_SOUNDS.sunrise;
    const ok = await playWithConfig(soundType, primaryConfig, gradualVolume, vibration);
    if (ok) return { ok: true, fellBack: false };

    const reason = `Could not play "${soundType}" sound — using fallback beeper`;
    console.warn('[AlarmSound]', reason);
    const fallbackOk = await playWithConfig('classic', ALARM_SOUNDS.classic, false, vibration);
    if (fallbackOk) {
      return { ok: true, fellBack: true, reason };
    }
    return {
      ok: false,
      fellBack: true,
      reason: 'Both primary and fallback alarm sounds failed to play',
    };
  }, [playWithConfig]);
 
   // Preview a sound (short play)
   const previewSound = useCallback(async (soundType: AlarmSoundType) => {
     try {
       console.log('[AlarmSound] Previewing sound:', soundType);
       await playAlarm(soundType, false, false);
       
       // Stop after 2 seconds
       setTimeout(() => {
         stopAlarm();
       }, 2000);
       
       return true;
     } catch (error) {
       console.error('[AlarmSound] Failed to preview sound:', error);
       return false;
     }
   }, [playAlarm, stopAlarm]);
 
   // Cleanup on unmount
   useEffect(() => {
     return () => {
       stopAlarm();
       if (audioContextRef.current) {
         audioContextRef.current.close();
         audioContextRef.current = null;
       }
     };
   }, [stopAlarm]);
 
   return {
     playAlarm,
     stopAlarm,
     previewSound,
     isPlaying: () => isPlayingRef.current,
   };
 };
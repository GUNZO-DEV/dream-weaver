 import { useState, useRef, useCallback, useEffect } from 'react';
 import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
 
 // Using data URIs for simple generated tones as fallback
 // In production, replace these with actual hosted audio files in /public/sounds/
 // For now, we'll use the Web Audio API to generate sounds
 
 interface SoundState {
   isPlaying: boolean;
   volume: number;
 }
 
 // Web Audio API based sound generator
 class SoundGenerator {
   private audioContext: AudioContext | null = null;
   private oscillators: Map<string, { oscillator: OscillatorNode; gainNode: GainNode }> = new Map();
   
   private getContext(): AudioContext {
     if (!this.audioContext) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.error('[SoundGenerator] AudioContext not available');
        throw new Error('AudioContext not supported');
      }
      this.audioContext = new AudioContextClass();
      console.log('[SoundGenerator] Created AudioContext, state:', this.audioContext.state);
     }
     return this.audioContext;
   }
   
   // Generate different sound types using oscillators and noise
   createSound(type: string, volume: number): boolean {
     try {
      console.log(`[SoundGenerator] Creating sound: ${type}, volume: ${volume}`);
       const ctx = this.getContext();
       
       // Resume context if suspended (iOS requirement)
       if (ctx.state === 'suspended') {
        console.log('[SoundGenerator] AudioContext suspended, resuming...');
        ctx.resume().then(() => {
          console.log('[SoundGenerator] AudioContext resumed, new state:', ctx.state);
        }).catch(err => {
          console.error('[SoundGenerator] Failed to resume AudioContext:', err);
        });
       }
      
      // Ensure volume is valid
      const safeVolume = Math.max(0, Math.min(100, volume || 50));
      console.log(`[SoundGenerator] Using safe volume: ${safeVolume}`);
       
       const gainNode = ctx.createGain();
       gainNode.connect(ctx.destination);
      gainNode.gain.value = safeVolume / 100 * 0.3; // Scale down to comfortable level
       
       let oscillator: OscillatorNode;
       
       switch (type) {
         case 'rain':
         case 'white noise':
           // Create noise using buffer source
           const noiseBuffer = this.createNoiseBuffer(ctx, type === 'rain' ? 'pink' : 'white');
           const noiseSource = ctx.createBufferSource();
           noiseSource.buffer = noiseBuffer;
           noiseSource.loop = true;
           noiseSource.connect(gainNode);
           noiseSource.start();
           this.oscillators.set(type, { oscillator: noiseSource as any, gainNode });
          console.log(`[SoundGenerator] ${type} started successfully`);
           return true;
           
         case 'ocean':
           // Low frequency oscillation for ocean waves
           oscillator = ctx.createOscillator();
           oscillator.type = 'sine';
           oscillator.frequency.value = 60;
           // Add modulation for wave effect
           const lfo = ctx.createOscillator();
           lfo.frequency.value = 0.1;
           const lfoGain = ctx.createGain();
           lfoGain.gain.value = 30;
           lfo.connect(lfoGain);
           lfoGain.connect(oscillator.frequency);
           lfo.start();
           oscillator.connect(gainNode);
           oscillator.start();
           this.oscillators.set(type, { oscillator, gainNode });
          console.log(`[SoundGenerator] ${type} started successfully`);
           return true;
           
         case 'wind':
           // Filtered noise for wind
           const windBuffer = this.createNoiseBuffer(ctx, 'pink');
           const windSource = ctx.createBufferSource();
           windSource.buffer = windBuffer;
           windSource.loop = true;
           const filter = ctx.createBiquadFilter();
           filter.type = 'lowpass';
           filter.frequency.value = 800;
           windSource.connect(filter);
           filter.connect(gainNode);
           windSource.start();
           this.oscillators.set(type, { oscillator: windSource as any, gainNode });
          console.log(`[SoundGenerator] ${type} started successfully`);
           return true;
           
         case 'forest':
         case 'birds':
           // Higher pitched tones for birds/forest
           oscillator = ctx.createOscillator();
           oscillator.type = 'sine';
           oscillator.frequency.value = 800;
           // Random modulation
           const birdLfo = ctx.createOscillator();
           birdLfo.frequency.value = 3;
           const birdLfoGain = ctx.createGain();
           birdLfoGain.gain.value = 400;
           birdLfo.connect(birdLfoGain);
           birdLfoGain.connect(oscillator.frequency);
           birdLfo.start();
           oscillator.connect(gainNode);
           oscillator.start();
           this.oscillators.set(type, { oscillator, gainNode });
          console.log(`[SoundGenerator] ${type} started successfully`);
           return true;
           
         case 'fireplace':
           // Crackling noise
           const fireBuffer = this.createNoiseBuffer(ctx, 'brown');
           const fireSource = ctx.createBufferSource();
           fireSource.buffer = fireBuffer;
           fireSource.loop = true;
           const fireFilter = ctx.createBiquadFilter();
           fireFilter.type = 'lowpass';
           fireFilter.frequency.value = 400;
           fireSource.connect(fireFilter);
           fireFilter.connect(gainNode);
           fireSource.start();
           this.oscillators.set(type, { oscillator: fireSource as any, gainNode });
          console.log(`[SoundGenerator] ${type} started successfully`);
           return true;
           
         case 'café':
           // Mix of low murmur sounds
           const cafeBuffer = this.createNoiseBuffer(ctx, 'pink');
           const cafeSource = ctx.createBufferSource();
           cafeSource.buffer = cafeBuffer;
           cafeSource.loop = true;
           const cafeFilter = ctx.createBiquadFilter();
           cafeFilter.type = 'bandpass';
           cafeFilter.frequency.value = 300;
           cafeSource.connect(cafeFilter);
           cafeFilter.connect(gainNode);
           cafeSource.start();
           this.oscillators.set(type, { oscillator: cafeSource as any, gainNode });
          console.log(`[SoundGenerator] ${type} started successfully`);
           return true;
           
         default:
          console.warn(`[SoundGenerator] Unknown sound type: ${type}`);
           return false;
       }
     } catch (error) {
       console.error('Failed to create sound:', error);
       return false;
     }
   }
   
   private createNoiseBuffer(ctx: AudioContext, type: 'white' | 'pink' | 'brown'): AudioBuffer {
     const bufferSize = ctx.sampleRate * 2; // 2 seconds
     const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
     const output = buffer.getChannelData(0);
     
     let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
     
     for (let i = 0; i < bufferSize; i++) {
       const white = Math.random() * 2 - 1;
       
       if (type === 'white') {
         output[i] = white;
       } else if (type === 'pink') {
         b0 = 0.99886 * b0 + white * 0.0555179;
         b1 = 0.99332 * b1 + white * 0.0750759;
         b2 = 0.96900 * b2 + white * 0.1538520;
         b3 = 0.86650 * b3 + white * 0.3104856;
         b4 = 0.55000 * b4 + white * 0.5329522;
         b5 = -0.7616 * b5 - white * 0.0168980;
         output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
         b6 = white * 0.115926;
       } else { // brown
         output[i] = (b0 + white * 0.02) * 3.5;
         b0 = output[i] * 0.99;
       }
     }
     
     return buffer;
   }
   
   stopSound(type: string) {
     const sound = this.oscillators.get(type);
     if (sound) {
       try {
         sound.oscillator.stop();
         sound.gainNode.disconnect();
        console.log(`[SoundGenerator] Stopped sound: ${type}`);
       } catch (e) {
         // Already stopped
        console.log(`[SoundGenerator] Sound already stopped: ${type}`);
       }
       this.oscillators.delete(type);
     }
   }
   
   setVolume(type: string, volume: number) {
     const sound = this.oscillators.get(type);
     if (sound) {
       sound.gainNode.gain.value = volume / 100 * 0.3;
     }
   }
   
   stopAll() {
    console.log('[SoundGenerator] Stopping all sounds');
     this.oscillators.forEach((_, type) => this.stopSound(type));
   }
 }
 
 export const useSoundPlayer = () => {
   const [activeSounds, setActiveSounds] = useState<Record<string, SoundState>>({});
   const [masterVolume, setMasterVolume] = useState(50);
   const [timerMinutes, setTimerMinutes] = useState(30);
   const soundGenerator = useRef<SoundGenerator | null>(null);
   const timerRef = useRef<NodeJS.Timeout | null>(null);
 
   // Initialize sound generator
   useEffect(() => {
    console.log('[useSoundPlayer] Initializing, platform:', Capacitor.getPlatform());
     soundGenerator.current = new SoundGenerator();
     
     return () => {
       soundGenerator.current?.stopAll();
       if (timerRef.current) clearTimeout(timerRef.current);
     };
   }, []);
 
   // Update volume when masterVolume changes
   useEffect(() => {
     Object.keys(activeSounds).forEach(key => {
       if (activeSounds[key]?.isPlaying) {
         soundGenerator.current?.setVolume(key, masterVolume);
       }
     });
   }, [masterVolume]);
 
   const toggleSound = useCallback((soundName: string) => {
     const key = soundName.toLowerCase();
    console.log(`[useSoundPlayer] Toggle sound: ${soundName}, key: ${key}`);
 
     const isCurrentlyPlaying = activeSounds[key]?.isPlaying ?? false;
    console.log(`[useSoundPlayer] Currently playing: ${isCurrentlyPlaying}`);
 
     if (isCurrentlyPlaying) {
       // Stop the sound
       soundGenerator.current?.stopSound(key);
       setActiveSounds(prev => ({
         ...prev,
         [key]: { ...prev[key], isPlaying: false }
       }));
     } else {
       // Start the sound
       const success = soundGenerator.current?.createSound(key, masterVolume);
      console.log(`[useSoundPlayer] Create sound result: ${success}`);
       
       if (success) {
         setActiveSounds(prev => ({
           ...prev,
           [key]: { isPlaying: true, volume: masterVolume }
         }));
         toast.success(`${soundName} playing`);
       } else {
         toast.error(`Could not play ${soundName}`);
       }
     }
   }, [activeSounds, masterVolume]);
 
   const stopAllSounds = useCallback(() => {
     soundGenerator.current?.stopAll();
     setActiveSounds({});
     toast.info('All sounds stopped');
   }, []);
 
   const startTimer = useCallback(() => {
     if (timerRef.current) clearTimeout(timerRef.current);
     
     timerRef.current = setTimeout(() => {
       stopAllSounds();
     }, timerMinutes * 60 * 1000);
   }, [timerMinutes, stopAllSounds]);
 
   const isSoundPlaying = useCallback((soundName: string): boolean => {
     const key = soundName.toLowerCase();
     return activeSounds[key]?.isPlaying ?? false;
   }, [activeSounds]);
 
   const getPlayingCount = useCallback((): number => {
     return Object.values(activeSounds).filter(s => s.isPlaying).length;
   }, [activeSounds]);
 
   // Play a preset (multiple sounds at once)
   const playPreset = useCallback((soundNames: string[]) => {
     // Stop all current sounds first
     soundGenerator.current?.stopAll();
     
     const newActiveSounds: Record<string, SoundState> = {};
     
     soundNames.forEach(name => {
       const key = name.toLowerCase();
       const success = soundGenerator.current?.createSound(key, masterVolume);
       if (success) {
         newActiveSounds[key] = { isPlaying: true, volume: masterVolume };
       }
     });
     
     setActiveSounds(newActiveSounds);
     toast.success(`Playing ${soundNames.join(' + ')}`);
   }, [masterVolume]);
 
   return {
     toggleSound,
     stopAllSounds,
     isSoundPlaying,
     getPlayingCount,
     masterVolume,
     setMasterVolume,
     timerMinutes,
     setTimerMinutes,
     startTimer,
     playPreset,
   };
 };
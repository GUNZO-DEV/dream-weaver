 import { useState, useRef, useCallback, useEffect } from 'react';
 
 // Using free ambient sound URLs from freesound.org (CC0 licensed sounds)
 // In production, you would host your own audio files
 const SOUND_URLS: Record<string, string> = {
   rain: 'https://cdn.freesound.org/previews/531/531947_6890693-lq.mp3',
   wind: 'https://cdn.freesound.org/previews/319/319224_5436764-lq.mp3',
   ocean: 'https://cdn.freesound.org/previews/621/621178_13613461-lq.mp3',
   forest: 'https://cdn.freesound.org/previews/509/509106_7722857-lq.mp3',
   'white noise': 'https://cdn.freesound.org/previews/133/133099_2337290-lq.mp3',
   fireplace: 'https://cdn.freesound.org/previews/499/499015_10741529-lq.mp3',
   birds: 'https://cdn.freesound.org/previews/528/528861_6890693-lq.mp3',
   café: 'https://cdn.freesound.org/previews/192/192310_3429316-lq.mp3',
 };
 
 interface SoundState {
   isPlaying: boolean;
   volume: number;
 }
 
 export const useSoundPlayer = () => {
   const [activeSounds, setActiveSounds] = useState<Record<string, SoundState>>({});
   const [masterVolume, setMasterVolume] = useState(50);
   const [timerMinutes, setTimerMinutes] = useState(30);
   const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
   const timerRef = useRef<NodeJS.Timeout | null>(null);
 
   // Clean up audio elements on unmount
   useEffect(() => {
     return () => {
       Object.values(audioRefs.current).forEach(audio => {
         audio.pause();
         audio.src = '';
       });
       if (timerRef.current) clearTimeout(timerRef.current);
     };
   }, []);
 
   // Update volume when masterVolume changes
   useEffect(() => {
     Object.entries(audioRefs.current).forEach(([_, audio]) => {
       audio.volume = masterVolume / 100;
     });
   }, [masterVolume]);
 
   const toggleSound = useCallback((soundName: string) => {
     const key = soundName.toLowerCase();
     const url = SOUND_URLS[key];
     
     if (!url) {
       console.warn(`No audio URL for sound: ${soundName}`);
       return;
     }
 
     const isCurrentlyPlaying = activeSounds[key]?.isPlaying ?? false;
 
     if (isCurrentlyPlaying) {
       // Stop the sound
       const audio = audioRefs.current[key];
       if (audio) {
         audio.pause();
         audio.currentTime = 0;
       }
       setActiveSounds(prev => ({
         ...prev,
         [key]: { ...prev[key], isPlaying: false }
       }));
     } else {
       // Start the sound - IMPORTANT: Must be triggered by user gesture
       let audio = audioRefs.current[key];
       
       if (!audio) {
         audio = new Audio(url);
         audio.loop = true;
         audio.volume = masterVolume / 100;
         audioRefs.current[key] = audio;
       }
 
       audio.play().catch(err => {
         console.error('Failed to play audio:', err);
       });
 
       setActiveSounds(prev => ({
         ...prev,
         [key]: { isPlaying: true, volume: masterVolume }
       }));
     }
   }, [activeSounds, masterVolume]);
 
   const stopAllSounds = useCallback(() => {
     Object.entries(audioRefs.current).forEach(([key, audio]) => {
       audio.pause();
       audio.currentTime = 0;
     });
     setActiveSounds({});
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
   };
 };
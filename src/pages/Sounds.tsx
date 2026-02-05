import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { SoundCard } from "@/components/SoundCard";
 import { CloudRain, Wind, Waves, TreePine, Music, Flame, Bird, Coffee, StopCircle, Timer } from "lucide-react";
import { Slider } from "@/components/ui/slider";
 import { useSoundPlayer } from "@/hooks/useSoundPlayer";
 import { Button } from "@/components/ui/button";
 import { toast } from "sonner";

const sounds = [
  { name: "Rain", icon: <CloudRain size={24} className="text-foreground" /> },
  { name: "Wind", icon: <Wind size={24} className="text-foreground" /> },
  { name: "Ocean", icon: <Waves size={24} className="text-foreground" /> },
  { name: "Forest", icon: <TreePine size={24} className="text-foreground" /> },
  { name: "White Noise", icon: <Music size={24} className="text-foreground" /> },
  { name: "Fireplace", icon: <Flame size={24} className="text-foreground" /> },
  { name: "Birds", icon: <Bird size={24} className="text-foreground" /> },
  { name: "Café", icon: <Coffee size={24} className="text-foreground" /> },
];

const Sounds = () => {
   const {
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
   } = useSoundPlayer();
 
   const handleStartTimer = () => {
     startTimer();
     toast.success(`Timer set for ${timerMinutes} minutes`);
   };
 
   const presets = [
     { name: "Rainy Night", description: "Rain + Wind", sounds: ["Rain", "Wind"] },
     { name: "Beach Vibes", description: "Ocean + Wind", sounds: ["Ocean", "Wind"] },
     { name: "Forest Walk", description: "Forest + Birds", sounds: ["Forest", "Birds"] },
     { name: "Cozy Evening", description: "Fireplace + Rain", sounds: ["Fireplace", "Rain"] },
   ];

  return (
    <div className="min-h-screen pb-24 relative">
      <StarField />

      <motion.header
        className="px-6 pt-12 pb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Sleep Sounds</h1>
        <p className="text-muted-foreground text-sm mt-1">Mix ambient sounds for better sleep</p>
      </motion.header>

      <main className="px-6 space-y-6 relative z-10">
        {/* Sound Grid */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-4 gap-3">
            {sounds.map((sound, index) => (
              <motion.div
                key={sound.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                 <SoundCard 
                   name={sound.name} 
                   icon={sound.icon} 
                   isPlaying={isSoundPlaying(sound.name)}
                   onToggle={() => toggleSound(sound.name)}
                 />
              </motion.div>
            ))}
          </div>
        </motion.section>

         {/* Stop All Button */}
         {getPlayingCount() > 0 && (
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
           >
             <Button
               onClick={stopAllSounds}
               variant="destructive"
               className="w-full h-12 rounded-2xl"
             >
               <StopCircle className="mr-2" size={20} />
               Stop All Sounds ({getPlayingCount()} playing)
             </Button>
           </motion.div>
         )}
 
        {/* Volume Control */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Volume</h3>
             <span className="text-primary font-medium">{masterVolume}%</span>
          </div>
          <Slider
             value={[masterVolume]}
             onValueChange={(v) => setMasterVolume(v[0])}
            max={100}
            step={1}
            className="w-full"
          />
        </motion.section>

        {/* Sleep Timer */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Sleep Timer</h3>
             <span className="text-primary font-medium">{timerMinutes} min</span>
          </div>
          <Slider
             value={[timerMinutes]}
             onValueChange={(v) => setTimerMinutes(v[0])}
            max={120}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>5 min</span>
            <span>1 hour</span>
            <span>2 hours</span>
          </div>
           <Button
             onClick={handleStartTimer}
             variant="outline"
             className="w-full mt-4 rounded-xl"
             disabled={getPlayingCount() === 0}
           >
             <Timer className="mr-2" size={18} />
             Start Timer
           </Button>
        </motion.section>

        {/* Presets */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Presets</h3>
          <div className="grid grid-cols-2 gap-3">
             {presets.map((preset) => (
              <motion.button
                key={preset.name}
                className="glass-card p-4 rounded-xl text-left hover:ring-1 hover:ring-primary transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                 onClick={() => playPreset(preset.sounds)}
              >
                <p className="font-medium text-foreground">{preset.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
              </motion.button>
            ))}
          </div>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Sounds;

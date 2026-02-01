import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { SoundCard } from "@/components/SoundCard";
import { CloudRain, Wind, Waves, TreePine, Music, Flame, Bird, Coffee } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { useState } from "react";

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
  const [volume, setVolume] = useState([50]);
  const [timer, setTimer] = useState([30]);

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
                <SoundCard name={sound.name} icon={sound.icon} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Volume Control */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">Volume</h3>
            <span className="text-primary font-medium">{volume[0]}%</span>
          </div>
          <Slider
            value={volume}
            onValueChange={setVolume}
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
            <span className="text-primary font-medium">{timer[0]} min</span>
          </div>
          <Slider
            value={timer}
            onValueChange={setTimer}
            max={120}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>5 min</span>
            <span>1 hour</span>
            <span>2 hours</span>
          </div>
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
            {[
              { name: "Rainy Night", description: "Rain + Thunder" },
              { name: "Beach Vibes", description: "Ocean + Wind" },
              { name: "Forest Walk", description: "Forest + Birds" },
              { name: "Cozy Evening", description: "Fireplace + Rain" },
            ].map((preset, index) => (
              <motion.button
                key={preset.name}
                className="glass-card p-4 rounded-xl text-left hover:ring-1 hover:ring-primary transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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

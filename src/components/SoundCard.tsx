import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";

interface SoundCardProps {
  name: string;
  icon: React.ReactNode;
  isPlaying?: boolean;
  onToggle?: () => void;
}

 export const SoundCard = ({ name, icon, isPlaying = false, onToggle }: SoundCardProps) => {
  return (
    <motion.button
       onClick={onToggle}
      className={`glass-card p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 ${
         isPlaying ? "ring-2 ring-primary glow" : ""
      }`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div 
        className={`w-12 h-12 rounded-full flex items-center justify-center ${
           isPlaying ? "gradient-primary" : "bg-secondary"
        }`}
         animate={isPlaying ? { scale: [1, 1.1, 1] } : {}}
         transition={{ duration: 2, repeat: isPlaying ? Infinity : 0 }}
      >
        {icon}
      </motion.div>
      <span className="text-sm font-medium text-foreground">{name}</span>
      <div className="text-muted-foreground">
         {isPlaying ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </div>
    </motion.button>
  );
};

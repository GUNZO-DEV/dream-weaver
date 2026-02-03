import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AlarmCardProps {
  time: string;
  label: string;
  enabled?: boolean;
  wakeWindow?: number;
  onToggle?: (enabled: boolean) => void;
}

export const AlarmCard = ({ 
  time, 
  label, 
  enabled = true, 
  wakeWindow = 30,
  onToggle 
}: AlarmCardProps) => {
  const [isEnabled, setIsEnabled] = useState(enabled);

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    onToggle?.(!isEnabled);
  };

  return (
    <motion.div
      className={`bg-secondary/50 p-5 rounded-2xl transition-all duration-300 ${
        isEnabled ? "opacity-100" : "opacity-50"
      }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isEnabled ? 1 : 0.5, y: 0 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-[42px] font-light text-foreground tracking-tight leading-none">
            {time}
          </div>
          <div className="text-[15px] text-muted-foreground mt-1">{label}</div>
        </div>
        <div className="flex items-center gap-4">
          <Switch checked={isEnabled} onCheckedChange={handleToggle} />
          <ChevronRight className="text-muted-foreground" size={20} strokeWidth={1.5} />
        </div>
      </div>
      
      {isEnabled && (
        <motion.div 
          className="mt-4 pt-4 border-t border-border/30"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <div className="flex items-center justify-between text-[14px]">
            <span className="text-muted-foreground">Smart Wake Window</span>
            <span className="text-primary font-medium">{wakeWindow} min</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

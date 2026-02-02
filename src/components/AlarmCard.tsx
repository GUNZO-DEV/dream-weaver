import { forwardRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell, ChevronRight } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface AlarmCardProps {
  time: string;
  label: string;
  enabled?: boolean;
  wakeWindow?: number;
  onToggle?: (enabled: boolean) => void;
}

export const AlarmCard = forwardRef<HTMLDivElement, AlarmCardProps>(({ 
  time, 
  label, 
  enabled = true, 
  wakeWindow = 30,
  onToggle 
}, ref) => {
  const [isEnabled, setIsEnabled] = useState(enabled);

  const handleToggle = () => {
    setIsEnabled(!isEnabled);
    onToggle?.(!isEnabled);
  };

  return (
    <motion.div
      ref={ref}
      className={`glass-card p-5 rounded-2xl transition-all duration-300 ${
        isEnabled ? "opacity-100" : "opacity-60"
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isEnabled ? 1 : 0.6, y: 0 }}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            isEnabled ? "gradient-accent" : "bg-secondary"
          }`}>
            <Bell size={20} className={isEnabled ? "text-accent-foreground" : "text-muted-foreground"} />
          </div>
          <div>
            <div className="text-3xl font-bold text-foreground">{time}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Switch checked={isEnabled} onCheckedChange={handleToggle} />
          <ChevronRight className="text-muted-foreground" size={20} />
        </div>
      </div>
      
      {isEnabled && (
        <motion.div 
          className="mt-4 pt-4 border-t border-border/50"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Smart Wake Window</span>
            <span className="text-primary font-medium">{wakeWindow} min</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});

AlarmCard.displayName = "AlarmCard";

import { useState } from "react";
import { motion } from "framer-motion";
  import { ChevronRight, Trash2, Edit2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
 import { Button } from "@/components/ui/button";

 const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
 
interface AlarmCardProps {
  time: string;
  label: string;
  enabled?: boolean;
  wakeWindow?: number;
   daysOfWeek?: number[];
  onToggle?: (enabled: boolean) => void;
   onDelete?: () => void;
    onEdit?: () => void;
}

export const AlarmCard = ({ 
  time, 
  label, 
  enabled = true, 
  wakeWindow = 30,
   daysOfWeek = [],
   onToggle,
    onDelete,
    onEdit
}: AlarmCardProps) => {
   const [isEnabled, setIsEnabled] = useState(enabled);
 
   // Sync with prop changes
   useState(() => {
     setIsEnabled(enabled);
   });

   const getDaysLabel = () => {
     if (daysOfWeek.length === 0) return "Once";
     if (daysOfWeek.length === 7) return "Every day";
     const weekdays = [1, 2, 3, 4, 5];
     const weekends = [0, 6];
     if (JSON.stringify([...daysOfWeek].sort()) === JSON.stringify(weekdays)) return "Weekdays";
     if (JSON.stringify([...daysOfWeek].sort()) === JSON.stringify(weekends)) return "Weekends";
     return daysOfWeek.map((d) => DAY_LABELS[d]).join(" ");
   };
 
  const handleToggle = () => {
     const newValue = !isEnabled;
     setIsEnabled(newValue);
     onToggle?.(newValue);
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
          <div className="text-[15px] text-muted-foreground mt-1">
            {label} <span className="text-primary/70">• {getDaysLabel()}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Switch checked={isEnabled} onCheckedChange={handleToggle} />
          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </button>
          )}
        </div>
      </div>
      
      {isEnabled && (
        <motion.div 
          className="mt-4 pt-4 border-t border-border/30"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
        >
           <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {DAY_LABELS.map((day, idx) => (
                    <span
                      key={idx}
                      className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center ${
                        daysOfWeek.includes(idx)
                          ? "bg-primary/80 text-primary-foreground"
                          : "bg-secondary/30 text-muted-foreground/50"
                      }`}
                    >
                      {day}
                    </span>
                  ))}
                </div>
                <div className="text-[12px] text-muted-foreground">
                  Wake: <span className="text-primary">{wakeWindow}min</span>
                </div>
             </div>
              <div className="flex items-center gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Edit2 size={14} />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

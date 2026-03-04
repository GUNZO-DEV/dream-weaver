import { motion, AnimatePresence } from "framer-motion";
import { BellRing, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMissedAlarms } from "@/hooks/useMissedAlarms";
import { formatDistanceToNow } from "date-fns";

export const MissedAlarmsBanner = () => {
  const { missedAlarms, missedCount, dismissAll, dismissOne } = useMissedAlarms();

  if (missedCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mx-6 mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 backdrop-blur-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <BellRing size={18} className="text-destructive animate-pulse" />
            <span className="text-sm font-semibold text-foreground">
              {missedCount} Missed Alarm{missedCount > 1 ? "s" : ""}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={dismissAll}
          >
            Dismiss All
          </Button>
        </div>

        <div className="px-4 pb-3 space-y-2 max-h-40 overflow-y-auto">
          {missedAlarms.map((alarm) => (
            <motion.div
              key={alarm.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center justify-between bg-background/50 rounded-xl px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {alarm.label || "Alarm"}
                  </span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatDistanceToNow(new Date(alarm.triggered_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => dismissOne(alarm.id)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

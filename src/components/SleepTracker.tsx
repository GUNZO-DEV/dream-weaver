import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Activity, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSleepTracking } from "@/hooks/useSleepTracking";
import React from "react";

const stageColors = {
  deep: "bg-sleep-deep",
  light: "bg-sleep-light",
  rem: "bg-sleep-rem",
  awake: "bg-sleep-awake",
};

const stageLabels = {
  deep: "Deep Sleep",
  light: "Light Sleep",
  rem: "REM Sleep",
  awake: "Awake",
};

export const SleepTracker = React.forwardRef<HTMLDivElement>((_, ref) => {
  const {
    isTracking,
    currentDuration,
    currentStage,
    motionLevel,
    noiseLevel,
    startTracking,
    stopTracking,
    formatDuration,
  } = useSleepTracking();

  const handleStop = () => {
    const record = stopTracking();
    console.log('Sleep record saved:', record);
  };

  return (
    <div ref={ref}>
      <AnimatePresence mode="wait">
        {isTracking ? (
          <motion.div
            key="tracking"
            className="bg-secondary/50 rounded-2xl p-6 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            {/* Tracking Timer */}
            <div className="text-center mb-5">
              <p className="text-muted-foreground text-[13px] uppercase tracking-wide mb-2">Tracking</p>
              <motion.div
                className="text-[48px] font-light text-foreground tracking-tight"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {formatDuration(currentDuration)}
              </motion.div>
            </div>

            {/* Current Stage */}
            <motion.div
              className={`px-5 py-2 rounded-full ${stageColors[currentStage]} mb-5`}
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-[13px] font-medium text-white">
                {stageLabels[currentStage]}
              </span>
            </motion.div>

            {/* Live Sensors */}
            <div className="w-full grid grid-cols-2 gap-3 mb-5">
              <div className="bg-background/50 p-3 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={14} className="text-primary" strokeWidth={2} />
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Motion</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    animate={{ width: `${motionLevel}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
              <div className="bg-background/50 p-3 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 size={14} className="text-accent" strokeWidth={2} />
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Noise</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-accent rounded-full"
                    animate={{ width: `${noiseLevel}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            </div>

            {/* Pulse */}
            <div className="relative w-24 h-24 mb-5">
              <motion.div
                className="absolute inset-0 rounded-full bg-primary/10"
                animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Moon size={32} className="text-primary" strokeWidth={1.5} />
              </div>
            </div>

            {/* Stop Button */}
            <Button
              onClick={handleStop}
              className="w-full h-[52px] text-[16px] font-semibold bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              <Sun className="mr-2" size={20} strokeWidth={1.5} />
              Stop & Save
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Button
              onClick={startTracking}
              className="w-full h-[56px] text-[16px] font-semibold bg-primary hover:bg-primary/90 rounded-xl"
            >
              <Moon className="mr-2" size={20} strokeWidth={1.5} />
              Start Sleep Tracking
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

SleepTracker.displayName = "SleepTracker";

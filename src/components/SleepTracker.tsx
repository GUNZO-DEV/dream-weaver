import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Activity, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSleepTracking } from "@/hooks/useSleepTracking";

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

export const SleepTracker = () => {
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
    <AnimatePresence mode="wait">
      {isTracking ? (
        <motion.div
          key="tracking"
          className="glass-card rounded-3xl p-8 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          {/* Tracking Timer */}
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-sm mb-2">Tracking Sleep</p>
            <motion.div
              className="text-5xl font-bold text-foreground font-mono"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {formatDuration(currentDuration)}
            </motion.div>
          </div>

          {/* Current Stage Indicator */}
          <motion.div
            className={`px-6 py-3 rounded-full ${stageColors[currentStage]} mb-6`}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-sm font-medium text-foreground">
              {stageLabels[currentStage]}
            </span>
          </motion.div>

          {/* Live Sensors */}
          <div className="w-full grid grid-cols-2 gap-4 mb-6">
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-primary" />
                <span className="text-xs text-muted-foreground">Motion</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${motionLevel}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-accent" />
                <span className="text-xs text-muted-foreground">Noise</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-accent"
                  animate={{ width: `${noiseLevel}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Pulse Animation */}
          <div className="relative w-32 h-32 mb-6">
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/30"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <Moon size={40} className="text-primary" />
            </div>
          </div>

          {/* Stop Button */}
          <Button
            onClick={handleStop}
            className="w-full h-14 text-lg font-semibold bg-destructive hover:bg-destructive/90 rounded-2xl"
            size="lg"
          >
            <Sun className="mr-2" size={24} />
            Stop & Save
          </Button>
        </motion.div>
      ) : (
        <motion.div
          key="idle"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <Button
            onClick={startTracking}
            className="w-full h-16 text-lg font-semibold gradient-primary border-0 rounded-2xl glow"
            size="lg"
          >
            <Moon className="mr-2" size={24} />
            Start Sleep Tracking
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

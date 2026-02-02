import { motion } from "framer-motion";
import { Moon, Play, Clock, TrendingUp, Zap } from "lucide-react";
import { SleepRing } from "@/components/SleepRing";
import { SleepStageBar } from "@/components/SleepStageBar";
import { StatCard } from "@/components/StatCard";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { SleepTracker } from "@/components/SleepTracker";
import { SleepDebtCard } from "@/components/SleepDebtCard";
import { getSleepHistory } from "@/hooks/useSleepTracking";

const sleepStages = [
  { type: "light" as const, duration: 45 },
  { type: "deep" as const, duration: 60 },
  { type: "rem" as const, duration: 30 },
  { type: "light" as const, duration: 40 },
  { type: "deep" as const, duration: 55 },
  { type: "rem" as const, duration: 35 },
  { type: "light" as const, duration: 25 },
  { type: "awake" as const, duration: 10 },
];

const totalDuration = sleepStages.reduce((acc, stage) => acc + stage.duration, 0);

const Index = () => {
  const history = getSleepHistory();
  const lastRecord = history[0];
  
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="min-h-screen pb-24 relative">
      <StarField />
      
      {/* Header */}
      <motion.header
        className="px-6 pt-12 pb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-muted-foreground text-sm">{greeting()}</p>
        <h1 className="text-2xl font-bold text-foreground mt-1">Sleep Dashboard</h1>
      </motion.header>

      {/* Main Content */}
      <main className="px-6 space-y-6 relative z-10">
        {/* Sleep Score Ring */}
        <motion.section
          className="glass-card rounded-3xl p-8 flex flex-col items-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="text-center mb-4">
            <p className="text-muted-foreground text-sm">
              {lastRecord ? "Last Night's Score" : "Ready to Track"}
            </p>
          </div>
          
          <SleepRing 
            percentage={lastRecord?.sleepScore || 0} 
            size={220} 
            label={lastRecord ? String(lastRecord.sleepScore) : "--"}
            sublabel={
              lastRecord 
                ? lastRecord.sleepScore >= 80 ? "Excellent" 
                  : lastRecord.sleepScore >= 60 ? "Good" 
                  : "Needs Improvement"
                : "Start tracking"
            }
          />

          {lastRecord && (
            <div className="mt-6 text-center">
              <p className="text-lg font-semibold text-foreground">
                {formatTime(lastRecord.duration)}
              </p>
              <p className="text-sm text-muted-foreground">Total sleep time</p>
            </div>
          )}
        </motion.section>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            icon={Clock} 
            label="Fell Asleep" 
            value={lastRecord ? new Date(lastRecord.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : "--:--"} 
            delay={0.3}
          />
          <StatCard 
            icon={TrendingUp} 
            label="Sleep Efficiency" 
            value={lastRecord ? `${Math.round((lastRecord.duration / 480) * 100)}%` : "--%"} 
            sublabel={lastRecord ? "+3% vs avg" : undefined}
            delay={0.4}
          />
        </div>

        {/* Sleep Stages */}
        {lastRecord && (
          <motion.section
            className="glass-card rounded-3xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Stages</h3>
            <SleepStageBar stages={sleepStages} totalDuration={totalDuration} />
          </motion.section>
        )}

        {/* Sleep Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <SleepTracker />
        </motion.div>

        {/* Sleep Debt Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
        >
          <SleepDebtCard />
        </motion.div>

        {/* Alarm Preview */}
        <motion.section
          className="glass-card rounded-3xl p-5 flex items-center justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full gradient-accent flex items-center justify-center">
              <Play size={20} className="text-accent-foreground ml-1" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Smart Alarm</p>
              <p className="text-sm text-muted-foreground">7:00 AM • 30 min window</p>
            </div>
          </div>
          <div className="text-sm text-primary font-medium">Edit</div>
        </motion.section>

        {/* Sleep Tips */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.75 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={20} className="text-accent" />
            <h3 className="text-lg font-semibold text-foreground">Sleep Tip</h3>
          </div>
          <p className="text-muted-foreground text-sm">
            Avoid screens 1 hour before bed. Blue light suppresses melatonin production and makes it harder to fall asleep.
          </p>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;

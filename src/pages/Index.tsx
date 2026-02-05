import { motion } from "framer-motion";
import { Clock, TrendingUp, Zap } from "lucide-react";
import { SleepRing } from "@/components/SleepRing";
import { SleepStageBar } from "@/components/SleepStageBar";
import { StatCard } from "@/components/StatCard";
import { BottomNav } from "@/components/BottomNav";
import { SleepTracker } from "@/components/SleepTracker";
import { SleepDebtCard } from "@/components/SleepDebtCard";
 import { getSleepHistory, SleepRecord } from "@/hooks/useSleepTracking";
import { Link } from "react-router-dom";
 import { useState, useEffect } from "react";

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
   const [lastRecord, setLastRecord] = useState<SleepRecord | null>(null);
   
   useEffect(() => {
     const loadHistory = async () => {
       const history = await getSleepHistory();
       if (history.length > 0) {
         setLastRecord(history[0]);
       }
     };
     loadHistory();
   }, []);
  
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
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <motion.header
        className="px-6 pt-14 pb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-muted-foreground text-[15px]">{greeting()}</p>
        <h1 className="text-[34px] font-bold text-foreground tracking-tight mt-0.5">Sleep</h1>
      </motion.header>

      {/* Main Content */}
      <main className="px-6 space-y-5">
        {/* Sleep Score Ring */}
        <motion.section
          className="bg-secondary/50 rounded-2xl p-8 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="text-center mb-2">
            <p className="text-muted-foreground text-[13px] uppercase tracking-wide">
              {lastRecord ? "Last Night" : "Ready to Track"}
            </p>
          </div>
          
          <SleepRing 
            percentage={lastRecord?.sleepScore || 0} 
            size={200} 
            strokeWidth={10}
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
            <div className="mt-4 text-center">
              <p className="text-[22px] font-semibold text-foreground tracking-tight">
                {formatTime(lastRecord.duration)}
              </p>
              <p className="text-[13px] text-muted-foreground mt-0.5">Total sleep time</p>
            </div>
          )}
        </motion.section>

        {/* Quick Stats */}
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <StatCard 
            icon={Clock} 
            label="Fell Asleep" 
            value={lastRecord ? new Date(lastRecord.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : "--:--"} 
          />
          <StatCard 
            icon={TrendingUp} 
            label="Efficiency" 
            value={lastRecord ? `${Math.round((lastRecord.duration / 480) * 100)}%` : "--%"} 
            sublabel={lastRecord ? "+3% vs avg" : undefined}
          />
        </motion.div>

        {/* Sleep Stages */}
        {lastRecord && (
          <motion.section
            className="bg-secondary/50 rounded-2xl p-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h3 className="text-[17px] font-semibold text-foreground mb-4">Sleep Stages</h3>
            <SleepStageBar stages={sleepStages} totalDuration={totalDuration} />
          </motion.section>
        )}

        {/* Sleep Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <SleepTracker />
        </motion.div>

        {/* Sleep Debt Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <SleepDebtCard />
        </motion.div>

        {/* Alarm Preview */}
        <Link to="/alarm">
          <motion.section
            className="bg-secondary/50 rounded-2xl p-4 flex items-center justify-between active:scale-[0.98] transition-transform"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-full bg-accent/20 flex items-center justify-center">
                <span className="text-accent text-lg">⏰</span>
              </div>
              <div>
                <p className="font-semibold text-foreground text-[15px]">Smart Alarm</p>
                <p className="text-[13px] text-muted-foreground">7:00 AM · 30 min window</p>
              </div>
            </div>
            <div className="text-[15px] text-primary font-medium">Edit</div>
          </motion.section>
        </Link>

        {/* Sleep Tips */}
        <motion.section
          className="bg-secondary/50 rounded-2xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-accent" />
            <h3 className="text-[15px] font-semibold text-foreground">Sleep Tip</h3>
          </div>
          <p className="text-muted-foreground text-[14px] leading-relaxed">
            Avoid screens 1 hour before bed. Blue light suppresses melatonin production and makes it harder to fall asleep.
          </p>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;

import { motion } from "framer-motion";
import { Moon, Play, Clock, TrendingUp } from "lucide-react";
import { SleepRing } from "@/components/SleepRing";
import { SleepStageBar } from "@/components/SleepStageBar";
import { StatCard } from "@/components/StatCard";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { Button } from "@/components/ui/button";

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
  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
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
            <p className="text-muted-foreground text-sm">Last Night's Score</p>
          </div>
          
          <SleepRing 
            percentage={85} 
            size={220} 
            label="85"
            sublabel="Excellent"
          />

          <div className="mt-6 text-center">
            <p className="text-lg font-semibold text-foreground">7h 32m</p>
            <p className="text-sm text-muted-foreground">Total sleep time</p>
          </div>
        </motion.section>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard 
            icon={Clock} 
            label="Fell Asleep" 
            value="11:24 PM" 
            delay={0.3}
          />
          <StatCard 
            icon={TrendingUp} 
            label="Sleep Efficiency" 
            value="92%" 
            sublabel="+3% vs avg"
            delay={0.4}
          />
        </div>

        {/* Sleep Stages */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Stages</h3>
          <SleepStageBar stages={sleepStages} totalDuration={totalDuration} />
        </motion.section>

        {/* Start Sleep Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Button 
            className="w-full h-16 text-lg font-semibold gradient-primary border-0 rounded-2xl glow"
            size="lg"
          >
            <Moon className="mr-2" size={24} />
            Start Sleep Tracking
          </Button>
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
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;

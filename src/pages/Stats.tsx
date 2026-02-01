import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { SleepRing } from "@/components/SleepRing";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";

const weeklyData = [
  { day: "Mon", hours: 7.5, score: 82 },
  { day: "Tue", hours: 6.2, score: 68 },
  { day: "Wed", hours: 8.0, score: 90 },
  { day: "Thu", hours: 7.0, score: 78 },
  { day: "Fri", hours: 5.5, score: 55 },
  { day: "Sat", hours: 9.0, score: 88 },
  { day: "Sun", hours: 7.5, score: 85 },
];

const maxHours = Math.max(...weeklyData.map((d) => d.hours));

const Stats = () => {
  const avgSleep = (weeklyData.reduce((acc, d) => acc + d.hours, 0) / weeklyData.length).toFixed(1);
  const avgScore = Math.round(weeklyData.reduce((acc, d) => acc + d.score, 0) / weeklyData.length);

  return (
    <div className="min-h-screen pb-24 relative">
      <StarField />

      <motion.header
        className="px-6 pt-12 pb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Calendar size={16} />
          <span>This Week</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mt-1">Sleep Statistics</h1>
      </motion.header>

      <main className="px-6 space-y-6 relative z-10">
        {/* Weekly Average */}
        <motion.section
          className="glass-card rounded-3xl p-6 flex items-center justify-between"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div>
            <p className="text-muted-foreground text-sm mb-1">Weekly Average</p>
            <p className="text-3xl font-bold text-foreground">{avgSleep}h</p>
            <div className="flex items-center gap-1 mt-2 text-sm text-success">
              <TrendingUp size={14} />
              <span>+0.5h vs last week</span>
            </div>
          </div>
          <SleepRing percentage={avgScore} size={100} label={`${avgScore}`} />
        </motion.section>

        {/* Weekly Chart */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-6">Sleep Duration</h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {weeklyData.map((item, index) => (
              <motion.div
                key={item.day}
                className="flex flex-col items-center gap-2 flex-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <motion.div
                  className="w-full rounded-t-lg gradient-primary"
                  initial={{ height: 0 }}
                  animate={{ height: `${(item.hours / maxHours) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.4 + index * 0.05 }}
                  style={{ minHeight: 4 }}
                />
                <span className="text-xs text-muted-foreground">{item.day}</span>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-between mt-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">5h 30m</p>
              <p className="text-xs text-muted-foreground">Min</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">9h 00m</p>
              <p className="text-xs text-muted-foreground">Max</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">8h</p>
              <p className="text-xs text-muted-foreground">Goal</p>
            </div>
          </div>
        </motion.section>

        {/* Sleep Quality Breakdown */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Quality Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: "Deep Sleep", value: "1h 45m", percentage: 23, color: "bg-sleep-deep" },
              { label: "Light Sleep", value: "3h 20m", percentage: 44, color: "bg-sleep-light" },
              { label: "REM Sleep", value: "1h 55m", percentage: 25, color: "bg-sleep-rem" },
              { label: "Awake", value: "32m", percentage: 8, color: "bg-sleep-awake" },
            ].map((item, index) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-foreground font-medium">{item.value}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${item.color} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    transition={{ duration: 0.8, delay: 0.5 + index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Insights */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                <TrendingUp size={16} className="text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Great deep sleep</p>
                <p className="text-xs text-muted-foreground">You're getting 15% more deep sleep than average</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                <TrendingDown size={16} className="text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Weekend irregularity</p>
                <p className="text-xs text-muted-foreground">Try keeping consistent sleep times on weekends</p>
              </div>
            </div>
          </div>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Stats;

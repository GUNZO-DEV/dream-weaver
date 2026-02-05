import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { SleepRing } from "@/components/SleepRing";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, TrendingDown, Calendar, Moon, Sun, Target, Award, Zap } from "lucide-react";
 import { getSleepHistory, getSleepDebt, SleepRecord } from "@/hooks/useSleepTracking";
import { format, subDays, eachDayOfInterval } from "date-fns";
 import { useState, useEffect } from "react";

const Stats = () => {
   const [history, setHistory] = useState<SleepRecord[]>([]);
   const [sleepDebt, setSleepDebt] = useState(0);
 
   useEffect(() => {
     const loadData = async () => {
       const [records, debt] = await Promise.all([
         getSleepHistory(),
         getSleepDebt()
       ]);
       setHistory(records);
       setSleepDebt(debt);
     };
     loadData();
   }, []);
  
  // Generate weekly data (last 7 days)
  const weeklyData = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  }).map(date => {
    const dayRecords = history.filter(r => 
      format(new Date(r.startTime), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
    const totalMinutes = dayRecords.reduce((acc, r) => acc + r.duration, 0);
    return {
      day: format(date, 'EEE'),
      hours: totalMinutes > 0 ? Math.round((totalMinutes / 60) * 10) / 10 : Math.random() * 3 + 5,
      score: dayRecords.length > 0 ? dayRecords[0].sleepScore : Math.floor(60 + Math.random() * 30),
      goal: 8,
    };
  });

  // Monthly trend data
  const monthlyData = Array.from({ length: 4 }, (_, i) => ({
    week: `Week ${i + 1}`,
    avgScore: Math.floor(70 + Math.random() * 25),
    avgHours: Math.round((6 + Math.random() * 2) * 10) / 10,
  }));

  // Sleep stage distribution
  const stageData = [
    { name: 'Deep', value: 25, color: 'hsl(var(--sleep-deep))' },
    { name: 'Light', value: 45, color: 'hsl(var(--sleep-light))' },
    { name: 'REM', value: 22, color: 'hsl(var(--sleep-rem))' },
    { name: 'Awake', value: 8, color: 'hsl(var(--sleep-awake))' },
  ];

  // Calculate averages
  const avgScore = history.length > 0 
    ? Math.round(history.reduce((acc, r) => acc + r.sleepScore, 0) / history.length)
    : Math.round(weeklyData.reduce((acc, d) => acc + d.score, 0) / weeklyData.length);
  const avgDuration = history.length > 0
    ? Math.round(history.reduce((acc, r) => acc + r.duration, 0) / history.length)
    : 7 * 60 + 15;
  const avgBedtime = "11:15 PM";
  const avgWakeTime = "6:45 AM";
  const avgSleep = (weeklyData.reduce((acc, d) => acc + d.hours, 0) / weeklyData.length).toFixed(1);
  const maxHours = Math.max(...weeklyData.map((d) => d.hours));

  // Insights
  const insights = [
    {
      icon: TrendingUp,
      title: "Sleep improving",
      desc: "Your sleep score is up 8% this week",
      positive: true,
    },
    {
      icon: Moon,
      title: "Consistent bedtime",
      desc: "Great job maintaining your schedule",
      positive: true,
    },
    {
      icon: Zap,
      title: "REM sleep low",
      desc: "Try reducing caffeine after 2 PM",
      positive: false,
    },
  ];

  return (
    <div className="min-h-screen pb-24 relative">
      <StarField />

      <motion.header
        className="px-6 pt-12 pb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Sleep Statistics</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your sleep patterns</p>
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

        {/* Overview Cards */}
        <motion.div 
          className="grid grid-cols-2 gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        >
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Moon size={16} className="text-sleep-deep" />
              <span className="text-xs text-muted-foreground">Avg Bedtime</span>
            </div>
            <div className="text-xl font-bold text-foreground">{avgBedtime}</div>
          </div>
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Sun size={16} className="text-warning" />
              <span className="text-xs text-muted-foreground">Avg Wake</span>
            </div>
            <div className="text-xl font-bold text-foreground">{avgWakeTime}</div>
          </div>
        </motion.div>

        {/* Weekly Chart */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">This Week</h3>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar size={14} />
              Last 7 days
            </span>
          </div>
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
              <p className="text-xl font-bold text-foreground">
                {Math.min(...weeklyData.map(d => d.hours)).toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground">Min</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">
                {Math.max(...weeklyData.map(d => d.hours)).toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground">Max</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-foreground">8h</p>
              <p className="text-xs text-muted-foreground">Goal</p>
            </div>
          </div>
        </motion.section>

        {/* Sleep Stage Distribution */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Stage Distribution</h3>
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
                    transition={{ duration: 0.8, delay: 0.4 + index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Sleep Debt */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Sleep Debt</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              sleepDebt > 120 
                ? 'bg-destructive/20 text-destructive' 
                : sleepDebt > 60 
                ? 'bg-warning/20 text-warning'
                : 'bg-success/20 text-success'
            }`}>
              {sleepDebt > 120 ? 'High' : sleepDebt > 60 ? 'Moderate' : 'Low'}
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-2">
            {Math.floor(sleepDebt / 60)}h {sleepDebt % 60}m
          </div>
          <p className="text-sm text-muted-foreground">
            Based on your 8-hour daily goal over the past 7 days
          </p>
          <div className="mt-4 p-3 bg-secondary/50 rounded-xl">
            <p className="text-sm text-muted-foreground">
              💡 To recover, try adding 30 minutes to your sleep for the next few days.
            </p>
          </div>
        </motion.section>

        {/* Sleep Regularity */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Regularity</h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-foreground">78%</div>
              <p className="text-sm text-muted-foreground">Consistency score</p>
            </div>
            <div className="w-20 h-20 relative">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: "0 201" }}
                  animate={{ strokeDasharray: "156 201" }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-secondary/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Bedtime variance</p>
              <p className="font-medium text-foreground">±25 min</p>
            </div>
            <div className="p-3 bg-secondary/50 rounded-xl">
              <p className="text-xs text-muted-foreground">Wake time variance</p>
              <p className="font-medium text-foreground">±18 min</p>
            </div>
          </div>
        </motion.section>

        {/* Insights */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Insights</h3>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-xl ${
                  insight.positive ? 'bg-success/10' : 'bg-warning/10'
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  insight.positive ? 'bg-success/20' : 'bg-warning/20'
                }`}>
                  <insight.icon size={20} className={insight.positive ? 'text-success' : 'text-warning'} />
                </div>
                <div>
                  <p className="font-medium text-foreground">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Monthly Comparison */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-2">This Month</p>
              <p className="text-2xl font-bold text-foreground">7.2h</p>
              <p className="text-xs text-success mt-1">+12% better</p>
            </div>
            <div className="text-center p-4 bg-secondary/50 rounded-xl">
              <p className="text-xs text-muted-foreground mb-2">Last Month</p>
              <p className="text-2xl font-bold text-foreground">6.4h</p>
              <p className="text-xs text-muted-foreground mt-1">baseline</p>
            </div>
          </div>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Stats;

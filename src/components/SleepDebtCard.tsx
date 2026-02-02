import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Target } from "lucide-react";
import { getSleepDebt, getSleepHistory } from "@/hooks/useSleepTracking";

export const SleepDebtCard = () => {
  const sleepDebt = getSleepDebt();
  const history = getSleepHistory().slice(0, 7);
  const targetMinutes = 8 * 60; // 8 hours
  
  const avgSleep = history.length > 0 
    ? Math.round(history.reduce((acc, r) => acc + r.duration, 0) / history.length)
    : 0;
  
  const debtHours = Math.floor(sleepDebt / 60);
  const debtMinutes = sleepDebt % 60;
  
  const avgHours = Math.floor(avgSleep / 60);
  const avgMinutes = avgSleep % 60;
  
  const isDeficit = avgSleep < targetMinutes;

  return (
    <motion.div
      className="glass-card rounded-3xl p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Sleep Debt</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          isDeficit ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
        }`}>
          {isDeficit ? 'In Debt' : 'On Track'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Weekly Debt */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={16} className="text-destructive" />
            <span className="text-xs text-muted-foreground">Weekly Debt</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {sleepDebt > 0 ? (
              <>
                {debtHours > 0 && `${debtHours}h `}
                {debtMinutes}m
              </>
            ) : (
              '0m'
            )}
          </div>
        </div>

        {/* Average Sleep */}
        <div className="glass-card p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground">Avg Sleep</span>
          </div>
          <div className="text-2xl font-bold text-foreground">
            {history.length > 0 ? (
              <>
                {avgHours}h {avgMinutes}m
              </>
            ) : (
              '--'
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Daily Goal Progress</span>
          <span className="text-foreground font-medium">
            {history.length > 0 ? Math.round((avgSleep / targetMinutes) * 100) : 0}%
          </span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isDeficit ? 'bg-warning' : 'bg-success'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (avgSleep / targetMinutes) * 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0h</span>
          <span className="flex items-center gap-1">
            <Target size={12} />
            8h target
          </span>
          <span>10h+</span>
        </div>
      </div>

      {/* Tip */}
      {isDeficit && sleepDebt > 120 && (
        <motion.div
          className="mt-4 p-3 bg-warning/10 rounded-xl border border-warning/20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-warning">
            💡 Try going to bed 30 minutes earlier to catch up on sleep debt.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};

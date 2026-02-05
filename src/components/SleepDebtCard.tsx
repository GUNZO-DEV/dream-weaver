import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Target } from "lucide-react";
 import { getSleepDebt, getSleepHistory, SleepRecord } from "@/hooks/useSleepTracking";
 import React, { useState, useEffect } from "react";

export const SleepDebtCard = React.forwardRef<HTMLDivElement>((_, ref) => {
   const [sleepDebt, setSleepDebt] = useState(0);
   const [history, setHistory] = useState<SleepRecord[]>([]);
 
   useEffect(() => {
     const loadData = async () => {
       const [debt, records] = await Promise.all([
         getSleepDebt(),
         getSleepHistory()
       ]);
       setSleepDebt(debt);
       setHistory(records.slice(0, 7));
     };
     loadData();
   }, []);
 
   const targetMinutes = 8 * 60;
   const avgSleep = history.length > 0
     ? Math.round(history.reduce((acc, r) => acc + r.duration, 0) / history.length)
    : 0;
  
  const debtHours = Math.floor(sleepDebt / 60);
  const debtMinutes = sleepDebt % 60;
  
  const avgHours = Math.floor(avgSleep / 60);
  const avgMinutes = avgSleep % 60;
  
  const isDeficit = avgSleep < targetMinutes;

  return (
    <div ref={ref} className="bg-secondary/50 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-semibold text-foreground">Sleep Debt</h3>
        <div className={`px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wide ${
          isDeficit ? 'bg-destructive/15 text-destructive' : 'bg-success/15 text-success'
        }`}>
          {isDeficit ? 'In Debt' : 'On Track'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Weekly Debt */}
        <div className="bg-background/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-destructive" strokeWidth={2} />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Weekly Debt</span>
          </div>
          <div className="text-[22px] font-semibold text-foreground tracking-tight">
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
        <div className="bg-background/50 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-primary" strokeWidth={2} />
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Avg Sleep</span>
          </div>
          <div className="text-[22px] font-semibold text-foreground tracking-tight">
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
        <div className="flex justify-between text-[13px]">
          <span className="text-muted-foreground">Daily Goal</span>
          <span className="text-foreground font-medium">
            {history.length > 0 ? Math.round((avgSleep / targetMinutes) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${isDeficit ? 'bg-accent' : 'bg-success'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (avgSleep / targetMinutes) * 100)}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>0h</span>
          <span className="flex items-center gap-1">
            <Target size={10} />
            8h target
          </span>
          <span>10h+</span>
        </div>
      </div>

      {/* Tip */}
      {isDeficit && sleepDebt > 120 && (
        <motion.div
          className="mt-4 p-3 bg-accent/10 rounded-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-[13px] text-accent">
            💡 Try going to bed 30 minutes earlier to catch up.
          </p>
        </motion.div>
      )}
    </div>
  );
});

SleepDebtCard.displayName = "SleepDebtCard";

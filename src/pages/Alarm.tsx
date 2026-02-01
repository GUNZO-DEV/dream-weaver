import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { AlarmCard } from "@/components/AlarmCard";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";

const Alarm = () => {
  const [smartWake, setSmartWake] = useState(true);
  const [vibration, setVibration] = useState(true);

  return (
    <div className="min-h-screen pb-24 relative">
      <StarField />

      <motion.header
        className="px-6 pt-12 pb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Smart Alarm</h1>
        <p className="text-muted-foreground text-sm mt-1">Wake up at the optimal time</p>
      </motion.header>

      <main className="px-6 space-y-6 relative z-10">
        {/* Alarms List */}
        <motion.section
          className="space-y-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <AlarmCard time="7:00 AM" label="Weekdays" wakeWindow={30} />
          <AlarmCard time="9:00 AM" label="Weekends" wakeWindow={45} enabled={false} />
        </motion.section>

        {/* Add Alarm Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Button 
            variant="outline" 
            className="w-full h-14 border-dashed border-2 rounded-2xl text-muted-foreground hover:text-foreground hover:border-primary"
          >
            <Plus className="mr-2" size={20} />
            Add New Alarm
          </Button>
        </motion.div>

        {/* Smart Wake Settings */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Smart Wake Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Clock size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Smart Wake</p>
                  <p className="text-xs text-muted-foreground">Wake during light sleep</p>
                </div>
              </div>
              <Switch checked={smartWake} onCheckedChange={setSmartWake} />
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Bell size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Vibration</p>
                  <p className="text-xs text-muted-foreground">Gentle haptic feedback</p>
                </div>
              </div>
              <Switch checked={vibration} onCheckedChange={setVibration} />
            </div>
          </div>
        </motion.section>

        {/* How it Works */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">How Smart Wake Works</h3>
          <div className="space-y-4">
            {[
              { step: 1, title: "Track Your Sleep", desc: "We monitor your sleep cycles throughout the night" },
              { step: 2, title: "Detect Light Sleep", desc: "Find the optimal wake-up moment in your cycle" },
              { step: 3, title: "Gentle Wake", desc: "Wake you during light sleep for a refreshed feeling" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Alarm Sounds */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Alarm Sound</h3>
              <p className="text-sm text-muted-foreground">Sunrise Melody</p>
            </div>
            <span className="text-primary font-medium">Change</span>
          </div>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Alarm;

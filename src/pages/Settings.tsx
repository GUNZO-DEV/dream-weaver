import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { Switch } from "@/components/ui/switch";
import { ChevronRight, Moon, Bell, Smartphone, Info, Share2, Star, User } from "lucide-react";
import { useState } from "react";

const Settings = () => {
  const [bedtimeReminder, setBedtimeReminder] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [lowPowerMode, setLowPowerMode] = useState(false);

  return (
    <div className="min-h-screen pb-24 relative">
      <StarField />

      <motion.header
        className="px-6 pt-12 pb-6 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </motion.header>

      <main className="px-6 space-y-6 relative z-10">
        {/* Profile Section */}
        <motion.section
          className="glass-card rounded-3xl p-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
              <User size={28} className="text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-lg">Sleep Well User</h3>
              <p className="text-sm text-muted-foreground">Premium Member</p>
            </div>
            <ChevronRight className="text-muted-foreground" size={20} />
          </div>
        </motion.section>

        {/* Sleep Settings */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Settings</h3>
          <div className="space-y-1">
            <SettingRow 
              icon={Moon} 
              title="Bedtime Reminder" 
              subtitle="Notify at 10:30 PM"
              toggle
              checked={bedtimeReminder}
              onCheckedChange={setBedtimeReminder}
            />
            <SettingRow 
              icon={Bell} 
              title="Sleep Tracking" 
              subtitle="Track sleep automatically"
              toggle
              checked={trackingEnabled}
              onCheckedChange={setTrackingEnabled}
            />
            <SettingRow 
              icon={Smartphone} 
              title="Low Power Mode" 
              subtitle="Reduce battery usage"
              toggle
              checked={lowPowerMode}
              onCheckedChange={setLowPowerMode}
            />
          </div>
        </motion.section>

        {/* Goals */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Goals</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Target Sleep Time</span>
              <span className="text-foreground font-medium">8 hours</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bedtime Goal</span>
              <span className="text-foreground font-medium">10:30 PM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Wake Time Goal</span>
              <span className="text-foreground font-medium">6:30 AM</span>
            </div>
          </div>
        </motion.section>

        {/* App Settings */}
        <motion.section
          className="glass-card rounded-3xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <SettingLink icon={Star} title="Rate SleepWell" />
          <SettingLink icon={Share2} title="Share with Friends" />
          <SettingLink icon={Info} title="About" />
        </motion.section>

        {/* Version */}
        <motion.p
          className="text-center text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          SleepWell v1.0.0
        </motion.p>
      </main>

      <BottomNav />
    </div>
  );
};

interface SettingRowProps {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  toggle?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const SettingRow = ({ icon: Icon, title, subtitle, toggle, checked, onCheckedChange }: SettingRowProps) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
        <Icon size={18} className="text-primary" />
      </div>
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {toggle ? (
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    ) : (
      <ChevronRight className="text-muted-foreground" size={20} />
    )}
  </div>
);

interface SettingLinkProps {
  icon: React.ElementType;
  title: string;
}

const SettingLink = ({ icon: Icon, title }: SettingLinkProps) => (
  <button className="w-full flex items-center justify-between p-5 hover:bg-secondary/50 transition-colors border-b border-border/50 last:border-0">
    <div className="flex items-center gap-3">
      <Icon size={20} className="text-muted-foreground" />
      <span className="font-medium text-foreground">{title}</span>
    </div>
    <ChevronRight className="text-muted-foreground" size={20} />
  </button>
);

export default Settings;

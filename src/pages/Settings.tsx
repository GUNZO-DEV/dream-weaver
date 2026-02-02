import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ChevronRight, Moon, Bell, Smartphone, Info, Share2, Star, User, Target, Clock, Volume2, Vibrate, CloudMoon, Activity } from "lucide-react";
import { useState } from "react";

const Settings = () => {
  const [bedtimeReminder, setBedtimeReminder] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [sonarTracking, setSonarTracking] = useState(false);
  const [antiSnoring, setAntiSnoring] = useState(true);
  const [targetSleep, setTargetSleep] = useState([8]);
  const [wakeWindow, setWakeWindow] = useState([30]);
  const [reminderTime, setReminderTime] = useState("10:30 PM");

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

        {/* Sleep Goals */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Goals</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-primary" />
                  <span className="text-muted-foreground">Target Sleep</span>
                </div>
                <span className="text-foreground font-medium">{targetSleep[0]}h</span>
              </div>
              <Slider
                value={targetSleep}
                onValueChange={setTargetSleep}
                min={5}
                max={10}
                step={0.5}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>5h</span>
                <span>10h</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-accent" />
                  <span className="text-muted-foreground">Smart Wake Window</span>
                </div>
                <span className="text-foreground font-medium">{wakeWindow[0]} min</span>
              </div>
              <Slider
                value={wakeWindow}
                onValueChange={setWakeWindow}
                min={10}
                max={60}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>10 min</span>
                <span>60 min</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <span className="text-muted-foreground">Bedtime Goal</span>
              <span className="text-foreground font-medium">10:30 PM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Wake Time Goal</span>
              <span className="text-foreground font-medium">6:30 AM</span>
            </div>
          </div>
        </motion.section>

        {/* Tracking Settings */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Sleep Tracking</h3>
          <div className="space-y-1">
            <SettingRow 
              icon={Activity} 
              title="Accelerometer" 
              subtitle="Track movement via phone sensors"
              toggle
              checked={trackingEnabled}
              onCheckedChange={setTrackingEnabled}
            />
            <SettingRow 
              icon={Volume2} 
              title="SONAR Tracking" 
              subtitle="Contactless ultrasonic detection"
              toggle
              checked={sonarTracking}
              onCheckedChange={setSonarTracking}
            />
            <SettingRow 
              icon={CloudMoon} 
              title="Anti-Snoring" 
              subtitle="Vibrate when snoring detected"
              toggle
              checked={antiSnoring}
              onCheckedChange={setAntiSnoring}
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

        {/* Notifications */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Notifications</h3>
          <div className="space-y-1">
            <SettingRow 
              icon={Moon} 
              title="Bedtime Reminder" 
              subtitle={`Notify at ${reminderTime}`}
              toggle
              checked={bedtimeReminder}
              onCheckedChange={setBedtimeReminder}
            />
            <SettingRow 
              icon={Bell} 
              title="Sleep Reports" 
              subtitle="Weekly sleep summary"
              toggle
              checked={true}
              onCheckedChange={() => {}}
            />
            <SettingRow 
              icon={Vibrate} 
              title="Haptic Feedback" 
              subtitle="Vibration on interactions"
              toggle
              checked={true}
              onCheckedChange={() => {}}
            />
          </div>
        </motion.section>

        {/* Integrations */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Integrations</h3>
          <div className="space-y-3">
            {[
              { name: 'Apple Health', connected: true },
              { name: 'Google Fit', connected: false },
              { name: 'Fitbit', connected: false },
              { name: 'Garmin', connected: false },
            ].map((integration) => (
              <div key={integration.name} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <span className="text-foreground">{integration.name}</span>
                <span className={`text-sm font-medium ${
                  integration.connected ? 'text-success' : 'text-primary'
                }`}>
                  {integration.connected ? 'Connected' : 'Connect'}
                </span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Data & Privacy */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-lg font-semibold text-foreground mb-4">Data & Privacy</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors">
              <span className="text-foreground">Export Sleep Data</span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-secondary/50 rounded-xl hover:bg-secondary/70 transition-colors">
              <span className="text-foreground">Backup to Cloud</span>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
            <button className="w-full flex items-center justify-between p-3 bg-destructive/10 rounded-xl hover:bg-destructive/20 transition-colors">
              <span className="text-destructive">Delete All Data</span>
              <ChevronRight size={18} className="text-destructive" />
            </button>
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
          SleepWell v2.0.0 • Made with 💜
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

import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { AlarmCard } from "@/components/AlarmCard";
import { AlarmCaptcha } from "@/components/AlarmCaptcha";
import { NoiseRecorder } from "@/components/NoiseRecorder";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Clock, Calculator, Brain, Type, Smartphone, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useAlarmCaptcha, CaptchaType } from "@/hooks/useAlarmCaptcha";

const captchaOptions: { type: CaptchaType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'math', label: 'Math', icon: <Calculator size={18} />, desc: 'Solve equations' },
  { type: 'memory', label: 'Memory', icon: <Brain size={18} />, desc: 'Remember sequence' },
  { type: 'typing', label: 'Typing', icon: <Type size={18} />, desc: 'Type a phrase' },
  { type: 'shake', label: 'Shake', icon: <Smartphone size={18} />, desc: 'Shake to dismiss' },
];

const Alarm = () => {
  const [smartWake, setSmartWake] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [showCaptcha, setShowCaptcha] = useState(false);
  
  const { settings, saveSettings, startAlarm } = useAlarmCaptcha();

  const testAlarm = () => {
    startAlarm();
    setShowCaptcha(true);
  };

  return (
    <div className="min-h-screen pb-24 relative">
      <StarField />

      {showCaptcha && (
        <AlarmCaptcha onDismiss={() => setShowCaptcha(false)} />
      )}

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

        {/* CAPTCHA Settings */}
        <motion.section
          className="glass-card rounded-3xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Shield size={18} className="text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">CAPTCHA</h3>
                <p className="text-xs text-muted-foreground">Tasks to dismiss alarm</p>
              </div>
            </div>
            <Switch 
              checked={settings.captchaEnabled} 
              onCheckedChange={(checked) => saveSettings({ captchaEnabled: checked })} 
            />
          </div>

          {settings.captchaEnabled && (
            <div className="space-y-4 mt-4">
              {/* CAPTCHA Type Selection */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Challenge Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {captchaOptions.map(option => (
                    <button
                      key={option.type}
                      onClick={() => saveSettings({ captchaType: option.type })}
                      className={`p-3 rounded-xl flex items-center gap-3 transition-all ${
                        settings.captchaType === option.type
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {option.icon}
                      <div className="text-left">
                        <p className="text-sm font-medium">{option.label}</p>
                        <p className="text-xs opacity-70">{option.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty */}
              <div>
                <p className="text-sm text-muted-foreground mb-3">Difficulty</p>
                <div className="flex gap-2">
                  {[1, 2, 3].map(level => (
                    <button
                      key={level}
                      onClick={() => saveSettings({ captchaDifficulty: level })}
                      className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                        settings.captchaDifficulty === level
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                    >
                      {level === 1 ? 'Easy' : level === 2 ? 'Medium' : 'Hard'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Button */}
              <Button 
                onClick={testAlarm}
                variant="outline" 
                className="w-full h-12 rounded-xl"
              >
                Test CAPTCHA
              </Button>
            </div>
          )}
        </motion.section>

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

        {/* Snore/Noise Recording */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <NoiseRecorder />
        </motion.div>

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

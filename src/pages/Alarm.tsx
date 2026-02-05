import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { AlarmCard } from "@/components/AlarmCard";
import { AlarmCaptcha } from "@/components/AlarmCaptcha";
import { NoiseRecorder } from "@/components/NoiseRecorder";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Clock, Calculator, Brain, Type, Smartphone, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
  import { useState, useEffect, useCallback } from "react";
import { useAlarmCaptcha, CaptchaType } from "@/hooks/useAlarmCaptcha";
 import { useAlarms } from "@/hooks/useAlarms";
 import { useNativeAlarm } from "@/hooks/useNativeAlarm";
 import { useAuth } from "@/contexts/AuthContext";
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { toast } from "sonner";

const captchaOptions: { type: CaptchaType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'math', label: 'Math', icon: <Calculator size={18} />, desc: 'Solve equations' },
  { type: 'memory', label: 'Memory', icon: <Brain size={18} />, desc: 'Remember sequence' },
  { type: 'typing', label: 'Typing', icon: <Type size={18} />, desc: 'Type a phrase' },
  { type: 'shake', label: 'Shake', icon: <Smartphone size={18} />, desc: 'Shake to dismiss' },
];

const Alarm = () => {
   const { user } = useAuth();
   const { alarms, isLoading, addAlarm, updateAlarm, deleteAlarm, toggleAlarm } = useAlarms();
    const { 
      scheduleRepeatingAlarm, 
      cancelAlarm: cancelNativeAlarm, 
      isNative, 
      registerAlarmActions,
      addNotificationListeners,
      requestPermissions 
    } = useNativeAlarm();
  const [smartWake, setSmartWake] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [showCaptcha, setShowCaptcha] = useState(false);
   const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
   const [newAlarmTime, setNewAlarmTime] = useState("07:00");
   const [newAlarmLabel, setNewAlarmLabel] = useState("");
  
  const { settings, saveSettings, startAlarm } = useAlarmCaptcha();

   // Generate a numeric ID from UUID for notifications
   const getNotificationId = useCallback((uuid: string): number => {
     return parseInt(uuid.substring(0, 8), 16) % 100000;
   }, []);
 
   // Schedule native notification for an alarm
   const scheduleNativeNotification = useCallback(async (alarm: {
     id: string;
     time: string;
     label: string | null;
     days_of_week: number[] | null;
     enabled: boolean | null;
   }) => {
     try {
       if (!isNative || !alarm.enabled) return;
       
       const [hours, minutes] = alarm.time.split(':').map(Number);
       const notificationId = getNotificationId(alarm.id);
       const days = alarm.days_of_week || [2, 3, 4, 5, 6]; // Default Mon-Fri
       
       await scheduleRepeatingAlarm(
         notificationId,
         "⏰ Wake Up!",
         alarm.label || "Time to wake up",
         hours,
         minutes,
         days
       );
       
       console.log(`Scheduled alarm ${alarm.id} at ${alarm.time} for days ${days.join(',')}`);
     } catch (error) {
       console.error("Failed to schedule native notification:", error);
     }
   }, [isNative, scheduleRepeatingAlarm, getNotificationId]);
 
   // Cancel native notification for an alarm
   const cancelNativeNotification = useCallback(async (alarmId: string, daysCount: number = 7) => {
     try {
       if (!isNative) return;
       
       const notificationId = getNotificationId(alarmId);
       // Cancel all day-specific notifications (id * 10 + dayIndex)
       for (let i = 0; i < daysCount; i++) {
         await cancelNativeAlarm(notificationId * 10 + i);
       }
       
       console.log(`Cancelled native notifications for alarm ${alarmId}`);
     } catch (error) {
       console.error("Failed to cancel native notification:", error);
     }
   }, [isNative, cancelNativeAlarm, getNotificationId]);
 
   useEffect(() => {
     if (isNative) {
       registerAlarmActions();
       requestPermissions();
       
       // Set up notification listeners
       const cleanup = addNotificationListeners(
         (notification) => {
           console.log('Notification received:', notification);
           // Show the CAPTCHA when alarm fires
           startAlarm();
           setShowCaptcha(true);
         },
         (action) => {
           console.log('Notification action:', action);
           if (action.actionId === 'snooze') {
             toast.info('Alarm snoozed for 5 minutes');
             // TODO: Reschedule for 5 minutes later
           } else if (action.actionId === 'dismiss') {
             toast.success('Alarm dismissed');
           }
         }
       );
       
       return cleanup;
     }
    }, [isNative, registerAlarmActions, requestPermissions, addNotificationListeners, startAlarm]);
 
   // Sync alarms with native notifications when alarms change
   useEffect(() => {
     if (isNative && alarms && alarms.length > 0) {
       // Schedule enabled alarms
       alarms.forEach(alarm => {
         if (alarm.enabled) {
           scheduleNativeNotification(alarm);
         }
       });
     }
   }, [isNative, alarms, scheduleNativeNotification]);
 
  const testAlarm = () => {
    startAlarm();
    setShowCaptcha(true);
  };

   const handleAddAlarm = async () => {
     if (!user) {
       toast.error("Please log in to add alarms");
       return;
     }
 
     try {
       const result = await addAlarm.mutateAsync({
         time: newAlarmTime,
         label: newAlarmLabel || null,
         enabled: true,
         days_of_week: [2, 3, 4, 5, 6], // Mon-Fri
         wake_window_minutes: 30,
         captcha_enabled: settings.captchaEnabled,
         captcha_type: settings.captchaType,
         captcha_difficulty: settings.captchaDifficulty,
         vibration,
         gradual_volume: true,
       });
 
        // Schedule native notification if on device (will be handled by useEffect sync)
        if (isNative && result) {
          await scheduleNativeNotification(result);
       }
 
       toast.success("Alarm added!");
       setIsAddDialogOpen(false);
       setNewAlarmTime("07:00");
       setNewAlarmLabel("");
     } catch (error) {
       toast.error("Failed to add alarm");
       console.error(error);
     }
   };
 
   const handleToggleAlarm = async (id: string, enabled: boolean) => {
     try {
       await toggleAlarm.mutateAsync({ id, enabled });
       
       // Update native notification
       if (isNative) {
         if (enabled) {
           const alarm = alarms?.find(a => a.id === id);
           if (alarm) {
             await scheduleNativeNotification({ ...alarm, enabled: true });
           }
         } else {
           await cancelNativeNotification(id);
         }
       }
       
       toast.success(enabled ? "Alarm enabled" : "Alarm disabled");
     } catch (error) {
       toast.error("Failed to update alarm");
     }
   };
 
   const handleDeleteAlarm = async (id: string) => {
     try {
       // Cancel native notification first
       if (isNative) {
         await cancelNativeNotification(id);
       }
       
       await deleteAlarm.mutateAsync(id);
       toast.success("Alarm deleted");
     } catch (error) {
       toast.error("Failed to delete alarm");
     }
   };
 
   const formatTime = (time: string) => {
     const [hours, minutes] = time.split(':').map(Number);
     const period = hours >= 12 ? 'PM' : 'AM';
     const displayHours = hours % 12 || 12;
     return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
   };
 
  return (
    <div className="min-h-screen pb-24 relative">
      <StarField />

      {showCaptcha && (
        <AlarmCaptcha 
          onDismiss={() => setShowCaptcha(false)} 
          captchaType={settings.captchaType}
          difficulty={settings.captchaDifficulty}
        />
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
           {isLoading ? (
             <div className="text-center text-muted-foreground py-8">Loading alarms...</div>
           ) : !user ? (
             <div className="text-center text-muted-foreground py-8">Please log in to manage alarms</div>
           ) : alarms && alarms.length > 0 ? (
             alarms.map((alarm) => (
               <AlarmCard
                 key={alarm.id}
                 time={formatTime(alarm.time)}
                 label={alarm.label || "Alarm"}
                 wakeWindow={alarm.wake_window_minutes || 30}
                 enabled={alarm.enabled ?? true}
                 onToggle={(enabled) => handleToggleAlarm(alarm.id, enabled)}
                 onDelete={() => handleDeleteAlarm(alarm.id)}
               />
             ))
           ) : (
             <div className="text-center text-muted-foreground py-8">No alarms set. Add one below!</div>
           )}
        </motion.section>

        {/* Add Alarm Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
           <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
             <DialogTrigger asChild>
               <Button 
                 variant="outline" 
                 className="w-full h-14 border-dashed border-2 rounded-2xl text-muted-foreground hover:text-foreground hover:border-primary"
                 disabled={!user}
               >
                 <Plus className="mr-2" size={20} />
                 Add New Alarm
               </Button>
             </DialogTrigger>
             <DialogContent className="bg-background border-border">
               <DialogHeader>
                 <DialogTitle>Add New Alarm</DialogTitle>
               </DialogHeader>
               <div className="space-y-4 pt-4">
                 <div className="space-y-2">
                   <Label htmlFor="time">Time</Label>
                   <Input
                     id="time"
                     type="time"
                     value={newAlarmTime}
                     onChange={(e) => setNewAlarmTime(e.target.value)}
                     className="text-lg"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label htmlFor="label">Label (optional)</Label>
                   <Input
                     id="label"
                     placeholder="e.g., Work, Gym, School"
                     value={newAlarmLabel}
                     onChange={(e) => setNewAlarmLabel(e.target.value)}
                   />
                 </div>
                 <Button onClick={handleAddAlarm} className="w-full" disabled={addAlarm.isPending}>
                   {addAlarm.isPending ? "Adding..." : "Add Alarm"}
                 </Button>
               </div>
             </DialogContent>
           </Dialog>
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

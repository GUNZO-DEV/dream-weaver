import { motion } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { StarField } from "@/components/StarField";
import { AlarmCard } from "@/components/AlarmCard";
import { NoiseRecorder } from "@/components/NoiseRecorder";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Clock, Shield } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect, useCallback, useMemo } from "react";
import { type CaptchaType } from "@/hooks/useAlarmCaptcha";
import { AlarmFormDialog, AlarmFormData } from "@/components/AlarmFormDialog";
import { useAlarms } from "@/hooks/useAlarms";
import { useNativeAlarm } from "@/hooks/useNativeAlarm";
import { useAuth } from "@/contexts/AuthContext";
import { useAlarmContext } from "@/contexts/AlarmContext";
import { toast } from "sonner";


const Alarm = () => {
  const { user } = useAuth();
  const { alarms, isLoading, error: alarmsError, addAlarm, updateAlarm, deleteAlarm, toggleAlarm } = useAlarms();
  const { scheduleRepeatingAlarm, cancelAlarm: cancelNativeAlarm, isNative } = useNativeAlarm();
  const { testAlarm } = useAlarmContext();

  const [smartWake, setSmartWake] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<string | null>(null);

  const alarmToEdit = useMemo(() => {
    if (!editingAlarm || !alarms) return undefined;
    return alarms.find((a) => a.id === editingAlarm);
  }, [editingAlarm, alarms]);

  useEffect(() => {
    console.log('[Alarm] Component mounted, isNative:', isNative);
  }, [isNative]);

  const getNotificationId = useCallback((uuid: string): number => {
    return parseInt(uuid.substring(0, 8), 16) % 100000;
  }, []);

  const scheduleNativeNotification = useCallback(async (alarm: {
    id: string; time: string; label: string | null; days_of_week: number[] | null; enabled: boolean | null;
  }) => {
    if (!isNative || !alarm.enabled) return;
    const [hours, minutes] = alarm.time.split(':').map(Number);
    const notificationId = getNotificationId(alarm.id);
    const days = alarm.days_of_week || [2, 3, 4, 5, 6];
    await scheduleRepeatingAlarm(notificationId, "⏰ Wake Up!", alarm.label || "Time to wake up", hours, minutes, days);
  }, [isNative, scheduleRepeatingAlarm, getNotificationId]);

  const cancelNativeNotification = useCallback(async (alarmId: string, daysCount: number = 7) => {
    if (!isNative) return;
    const notificationId = getNotificationId(alarmId);
    for (let i = 0; i < daysCount; i++) {
      await cancelNativeAlarm(notificationId * 10 + i);
    }
  }, [isNative, cancelNativeAlarm, getNotificationId]);

  // Sync alarms with native notifications
  useEffect(() => {
    if (isNative && alarms && alarms.length > 0) {
      alarms.forEach(alarm => {
        if (alarm.enabled) scheduleNativeNotification(alarm);
      });
    }
  }, [isNative, alarms, scheduleNativeNotification]);
 


 
   const handleFormSubmit = async (data: AlarmFormData) => {
     if (!user) {
       toast.error("Please log in to manage alarms");
       return;
     }
 
     console.log('[Alarm] Submitting alarm:', data);
 
     try {
       if (editingAlarm) {
         // Update existing alarm
         await updateAlarm.mutateAsync({
           id: editingAlarm,
           time: data.time,
           label: data.label || null,
           days_of_week: data.days_of_week,
           wake_window_minutes: data.wake_window_minutes,
           captcha_enabled: data.captcha_enabled,
           captcha_type: data.captcha_type,
           captcha_difficulty: data.captcha_difficulty,
           vibration: data.vibration,
           gradual_volume: data.gradual_volume,
           sound_id: data.sound_id,
         });
         toast.success("Alarm updated!");
       } else {
         // Create new alarm
         const result = await addAlarm.mutateAsync({
           time: data.time,
           label: data.label || null,
           enabled: true,
           days_of_week: data.days_of_week,
           wake_window_minutes: data.wake_window_minutes,
           captcha_enabled: data.captcha_enabled,
           captcha_type: data.captcha_type,
           captcha_difficulty: data.captcha_difficulty,
           vibration: data.vibration,
           gradual_volume: data.gradual_volume,
           sound_id: data.sound_id,
         });
 
         console.log('[Alarm] Alarm added successfully:', result?.id);
 
         // Schedule native notification if on device
         if (isNative && result) {
           console.log('[Alarm] Scheduling native notification for:', result.id);
           await scheduleNativeNotification(result);
         }
 
         toast.success("Alarm added!");
       }
       
       setIsFormDialogOpen(false);
       setEditingAlarm(null);
     } catch (error) {
       console.error('[Alarm] Failed to save alarm:', error);
       toast.error("Failed to save alarm");
     }
   };
 
   const handleEditAlarm = (id: string) => {
     setEditingAlarm(id);
     setIsFormDialogOpen(true);
   };
 
   const handleAddNewAlarm = () => {
     setEditingAlarm(null);
     setIsFormDialogOpen(true);
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
 
 
       {/* Alarm Form Dialog */}
       <AlarmFormDialog
         open={isFormDialogOpen}
         onOpenChange={(open) => {
           setIsFormDialogOpen(open);
           if (!open) setEditingAlarm(null);
         }}
         onSubmit={handleFormSubmit}
         isEditing={!!editingAlarm}
         isPending={addAlarm.isPending || updateAlarm.isPending}
         initialData={
           alarmToEdit
             ? {
                 time: alarmToEdit.time,
                 label: alarmToEdit.label || "",
                 days_of_week: alarmToEdit.days_of_week || [1, 2, 3, 4, 5],
                 sound_id: alarmToEdit.sound_id || "sunrise",
                 gradual_volume: alarmToEdit.gradual_volume ?? true,
                 vibration: alarmToEdit.vibration ?? true,
                 wake_window_minutes: alarmToEdit.wake_window_minutes || 30,
                 captcha_enabled: alarmToEdit.captcha_enabled ?? true,
                 captcha_type: (alarmToEdit.captcha_type as CaptchaType) || "math",
                 captcha_difficulty: alarmToEdit.captcha_difficulty || 2,
               }
             : undefined
         }
       />
 
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
                 daysOfWeek={alarm.days_of_week || []}
                 onToggle={(enabled) => handleToggleAlarm(alarm.id, enabled)}
                 onDelete={() => handleDeleteAlarm(alarm.id)}
                 onEdit={() => handleEditAlarm(alarm.id)}
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
           <Button 
             variant="outline" 
             className="w-full h-14 border-dashed border-2 rounded-2xl text-muted-foreground hover:text-foreground hover:border-primary"
             disabled={!user}
             onClick={handleAddNewAlarm}
           >
             <Plus className="mr-2" size={20} />
             Add New Alarm
           </Button>
         </motion.div>
 
         {/* Test CAPTCHA Button */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.35 }}
         >
           <Button 
             onClick={testAlarm}
             variant="outline" 
             className="w-full h-12 rounded-xl"
           >
             <Shield className="mr-2" size={18} />
             Test Alarm Sound
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
       </main>
 
       <BottomNav />
     </div>
   );
 };
 
 export default Alarm;
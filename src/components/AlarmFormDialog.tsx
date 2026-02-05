 import { useState, useEffect } from "react";
 import { motion, AnimatePresence } from "framer-motion";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Switch } from "@/components/ui/switch";
 import { Slider } from "@/components/ui/slider";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import {
   Bell,
   Clock,
   Calculator,
   Brain,
   Type,
   Smartphone,
   Volume2,
   Vibrate,
   Moon,
   Sun,
   Repeat,
   Shield,
   Music,
   Timer,
 } from "lucide-react";
 import { CaptchaType } from "@/hooks/useAlarmCaptcha";
 
 const DAYS = [
   { id: 0, label: "S", name: "Sunday" },
   { id: 1, label: "M", name: "Monday" },
   { id: 2, label: "T", name: "Tuesday" },
   { id: 3, label: "W", name: "Wednesday" },
   { id: 4, label: "T", name: "Thursday" },
   { id: 5, label: "F", name: "Friday" },
   { id: 6, label: "S", name: "Saturday" },
 ];
 
 const ALARM_SOUNDS = [
   { id: "sunrise", name: "Sunrise Melody", category: "Gentle" },
   { id: "birds", name: "Morning Birds", category: "Nature" },
   { id: "ocean", name: "Ocean Waves", category: "Nature" },
   { id: "piano", name: "Soft Piano", category: "Gentle" },
   { id: "digital", name: "Digital Beep", category: "Classic" },
   { id: "alarm", name: "Classic Alarm", category: "Classic" },
   { id: "chimes", name: "Wind Chimes", category: "Gentle" },
   { id: "forest", name: "Forest Morning", category: "Nature" },
 ];
 
 const CAPTCHA_OPTIONS: { type: CaptchaType; label: string; icon: React.ReactNode; desc: string }[] = [
   { type: "math", label: "Math", icon: <Calculator size={18} />, desc: "Solve equations" },
   { type: "memory", label: "Memory", icon: <Brain size={18} />, desc: "Remember sequence" },
   { type: "typing", label: "Typing", icon: <Type size={18} />, desc: "Type a phrase" },
   { type: "shake", label: "Shake", icon: <Smartphone size={18} />, desc: "Shake device" },
 ];
 
 const SNOOZE_OPTIONS = [
   { minutes: 5, label: "5 min" },
   { minutes: 10, label: "10 min" },
   { minutes: 15, label: "15 min" },
   { minutes: 20, label: "20 min" },
   { minutes: 30, label: "30 min" },
 ];
 
 export interface AlarmFormData {
   time: string;
   label: string;
   days_of_week: number[];
   sound_id: string;
   gradual_volume: boolean;
   vibration: boolean;
   smart_wake_enabled: boolean;
   wake_window_minutes: number;
   snooze_enabled: boolean;
   snooze_duration: number;
   snooze_limit: number;
   captcha_enabled: boolean;
   captcha_type: CaptchaType;
   captcha_difficulty: number;
 }
 
 interface AlarmFormDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   onSubmit: (data: AlarmFormData) => void;
   initialData?: Partial<AlarmFormData>;
   isEditing?: boolean;
   isPending?: boolean;
 }
 
 const defaultFormData: AlarmFormData = {
   time: "07:00",
   label: "",
   days_of_week: [1, 2, 3, 4, 5], // Mon-Fri
   sound_id: "sunrise",
   gradual_volume: true,
   vibration: true,
   smart_wake_enabled: true,
   wake_window_minutes: 30,
   snooze_enabled: true,
   snooze_duration: 10,
   snooze_limit: 3,
   captcha_enabled: true,
   captcha_type: "math",
   captcha_difficulty: 2,
 };
 
 export const AlarmFormDialog = ({
   open,
   onOpenChange,
   onSubmit,
   initialData,
   isEditing = false,
   isPending = false,
 }: AlarmFormDialogProps) => {
   const [formData, setFormData] = useState<AlarmFormData>({
     ...defaultFormData,
     ...initialData,
   });
   const [activeSection, setActiveSection] = useState<string | null>(null);
 
   useEffect(() => {
     if (open) {
       setFormData({ ...defaultFormData, ...initialData });
       setActiveSection(null);
     }
   }, [open, initialData]);
 
   const updateField = <K extends keyof AlarmFormData>(
     field: K,
     value: AlarmFormData[K]
   ) => {
     setFormData((prev) => ({ ...prev, [field]: value }));
   };
 
   const toggleDay = (dayId: number) => {
     const current = formData.days_of_week;
     const updated = current.includes(dayId)
       ? current.filter((d) => d !== dayId)
       : [...current, dayId].sort();
     updateField("days_of_week", updated);
   };
 
   const getDaysLabel = () => {
     const days = formData.days_of_week;
     if (days.length === 0) return "Never";
     if (days.length === 7) return "Every day";
     if (JSON.stringify(days.sort()) === JSON.stringify([1, 2, 3, 4, 5])) return "Weekdays";
     if (JSON.stringify(days.sort()) === JSON.stringify([0, 6])) return "Weekends";
     return days.map((d) => DAYS[d].label).join(", ");
   };
 
   const handleSubmit = () => {
     onSubmit(formData);
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="bg-background border-border max-w-md max-h-[90vh] p-0 overflow-hidden">
         <DialogHeader className="px-6 pt-6 pb-4">
           <DialogTitle>{isEditing ? "Edit Alarm" : "New Alarm"}</DialogTitle>
         </DialogHeader>
 
         <ScrollArea className="max-h-[calc(90vh-140px)]">
           <div className="px-6 pb-6 space-y-6">
             {/* Time Picker */}
             <div className="flex flex-col items-center py-4">
               <Input
                 type="time"
                 value={formData.time}
                 onChange={(e) => updateField("time", e.target.value)}
                 className="text-5xl h-20 text-center font-light bg-secondary/30 border-0 rounded-2xl w-full max-w-[200px]"
               />
             </div>
 
             {/* Label */}
             <div className="space-y-2">
               <Label className="text-muted-foreground text-sm">Label</Label>
               <Input
                 placeholder="e.g., Work, Gym, School..."
                 value={formData.label}
                 onChange={(e) => updateField("label", e.target.value)}
                 className="bg-secondary/30"
               />
             </div>
 
             {/* Repeat Days */}
             <div className="space-y-3">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <Repeat size={18} className="text-muted-foreground" />
                   <Label className="text-muted-foreground text-sm">Repeat</Label>
                 </div>
                 <span className="text-sm text-primary">{getDaysLabel()}</span>
               </div>
               <div className="flex justify-between gap-1">
                 {DAYS.map((day) => (
                   <button
                     key={day.id}
                     onClick={() => toggleDay(day.id)}
                     className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                       formData.days_of_week.includes(day.id)
                         ? "bg-primary text-primary-foreground"
                         : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                     }`}
                   >
                     {day.label}
                   </button>
                 ))}
               </div>
             </div>
 
             {/* Alarm Sound */}
             <div className="space-y-3">
               <button
                 onClick={() => setActiveSection(activeSection === "sound" ? null : "sound")}
                 className="w-full flex items-center justify-between p-4 bg-secondary/30 rounded-xl"
               >
                 <div className="flex items-center gap-3">
                   <Music size={18} className="text-muted-foreground" />
                   <span className="text-foreground">Alarm Sound</span>
                 </div>
                 <span className="text-sm text-primary">
                   {ALARM_SOUNDS.find((s) => s.id === formData.sound_id)?.name || "Select"}
                 </span>
               </button>
               <AnimatePresence>
                 {activeSection === "sound" && (
                   <motion.div
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: "auto", opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden"
                   >
                     <div className="grid grid-cols-2 gap-2 pt-2">
                       {ALARM_SOUNDS.map((sound) => (
                         <button
                           key={sound.id}
                           onClick={() => updateField("sound_id", sound.id)}
                           className={`p-3 rounded-xl text-left transition-all ${
                             formData.sound_id === sound.id
                               ? "bg-primary text-primary-foreground"
                               : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                           }`}
                         >
                           <p className="text-sm font-medium">{sound.name}</p>
                           <p className="text-xs opacity-70">{sound.category}</p>
                         </button>
                       ))}
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
 
             {/* Volume & Vibration Settings */}
             <div className="space-y-3">
               <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                 <div className="flex items-center gap-3">
                   <Volume2 size={18} className="text-muted-foreground" />
                   <div>
                     <span className="text-foreground">Gentle Volume</span>
                     <p className="text-xs text-muted-foreground">Start quiet, increase gradually</p>
                   </div>
                 </div>
                 <Switch
                   checked={formData.gradual_volume}
                   onCheckedChange={(v) => updateField("gradual_volume", v)}
                 />
               </div>
 
               <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                 <div className="flex items-center gap-3">
                   <Vibrate size={18} className="text-muted-foreground" />
                   <span className="text-foreground">Vibration</span>
                 </div>
                 <Switch
                   checked={formData.vibration}
                   onCheckedChange={(v) => updateField("vibration", v)}
                 />
               </div>
             </div>
 
             {/* Smart Wake */}
             <div className="space-y-3">
               <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
                 <div className="flex items-center gap-3">
                   <Sun size={18} className="text-muted-foreground" />
                   <div>
                     <span className="text-foreground">Smart Wake</span>
                     <p className="text-xs text-muted-foreground">Wake during light sleep</p>
                   </div>
                 </div>
                 <Switch
                   checked={formData.smart_wake_enabled}
                   onCheckedChange={(v) => updateField("smart_wake_enabled", v)}
                 />
               </div>
 
               {formData.smart_wake_enabled && (
                 <motion.div
                   initial={{ height: 0, opacity: 0 }}
                   animate={{ height: "auto", opacity: 1 }}
                   className="p-4 bg-secondary/20 rounded-xl space-y-3"
                 >
                   <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Wake Window</span>
                     <span className="text-sm text-primary font-medium">
                       {formData.wake_window_minutes} min before
                     </span>
                   </div>
                   <Slider
                     value={[formData.wake_window_minutes]}
                     onValueChange={([v]) => updateField("wake_window_minutes", v)}
                     min={10}
                     max={60}
                     step={5}
                     className="w-full"
                   />
                   <div className="flex justify-between text-xs text-muted-foreground">
                     <span>10 min</span>
                     <span>60 min</span>
                   </div>
                 </motion.div>
               )}
             </div>
 
             {/* Snooze Settings */}
             <div className="space-y-3">
               <button
                 onClick={() => setActiveSection(activeSection === "snooze" ? null : "snooze")}
                 className="w-full flex items-center justify-between p-4 bg-secondary/30 rounded-xl"
               >
                 <div className="flex items-center gap-3">
                   <Timer size={18} className="text-muted-foreground" />
                   <span className="text-foreground">Snooze</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-sm text-muted-foreground">
                     {formData.snooze_enabled
                       ? `${formData.snooze_duration}min × ${formData.snooze_limit}`
                       : "Off"}
                   </span>
                   <Switch
                     checked={formData.snooze_enabled}
                     onCheckedChange={(v) => updateField("snooze_enabled", v)}
                     onClick={(e) => e.stopPropagation()}
                   />
                 </div>
               </button>
 
               <AnimatePresence>
                 {activeSection === "snooze" && formData.snooze_enabled && (
                   <motion.div
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: "auto", opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden"
                   >
                     <div className="p-4 bg-secondary/20 rounded-xl space-y-4">
                       <div className="space-y-2">
                         <Label className="text-sm text-muted-foreground">Snooze Duration</Label>
                         <div className="flex gap-2 flex-wrap">
                           {SNOOZE_OPTIONS.map((opt) => (
                             <button
                               key={opt.minutes}
                               onClick={() => updateField("snooze_duration", opt.minutes)}
                               className={`px-4 py-2 rounded-xl text-sm transition-all ${
                                 formData.snooze_duration === opt.minutes
                                   ? "bg-primary text-primary-foreground"
                                   : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                               }`}
                             >
                               {opt.label}
                             </button>
                           ))}
                         </div>
                       </div>
 
                       <div className="space-y-2">
                         <Label className="text-sm text-muted-foreground">Max Snooze Count</Label>
                         <div className="flex gap-2">
                           {[1, 2, 3, 5, 10].map((count) => (
                             <button
                               key={count}
                               onClick={() => updateField("snooze_limit", count)}
                               className={`px-4 py-2 rounded-xl text-sm transition-all ${
                                 formData.snooze_limit === count
                                   ? "bg-primary text-primary-foreground"
                                   : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                               }`}
                             >
                               {count}×
                             </button>
                           ))}
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
 
             {/* CAPTCHA Settings */}
             <div className="space-y-3">
               <button
                 onClick={() => setActiveSection(activeSection === "captcha" ? null : "captcha")}
                 className="w-full flex items-center justify-between p-4 bg-secondary/30 rounded-xl"
               >
                 <div className="flex items-center gap-3">
                   <Shield size={18} className="text-muted-foreground" />
                   <div>
                     <span className="text-foreground">CAPTCHA</span>
                     <p className="text-xs text-muted-foreground">Task to dismiss alarm</p>
                   </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <span className="text-sm text-muted-foreground">
                     {formData.captcha_enabled
                       ? CAPTCHA_OPTIONS.find((c) => c.type === formData.captcha_type)?.label
                       : "Off"}
                   </span>
                   <Switch
                     checked={formData.captcha_enabled}
                     onCheckedChange={(v) => updateField("captcha_enabled", v)}
                     onClick={(e) => e.stopPropagation()}
                   />
                 </div>
               </button>
 
               <AnimatePresence>
                 {activeSection === "captcha" && formData.captcha_enabled && (
                   <motion.div
                     initial={{ height: 0, opacity: 0 }}
                     animate={{ height: "auto", opacity: 1 }}
                     exit={{ height: 0, opacity: 0 }}
                     className="overflow-hidden"
                   >
                     <div className="p-4 bg-secondary/20 rounded-xl space-y-4">
                       <div className="space-y-2">
                         <Label className="text-sm text-muted-foreground">Challenge Type</Label>
                         <div className="grid grid-cols-2 gap-2">
                           {CAPTCHA_OPTIONS.map((option) => (
                             <button
                               key={option.type}
                               onClick={() => updateField("captcha_type", option.type)}
                               className={`p-3 rounded-xl flex items-center gap-2 transition-all ${
                                 formData.captcha_type === option.type
                                   ? "bg-primary text-primary-foreground"
                                   : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                               }`}
                             >
                               {option.icon}
                               <div className="text-left">
                                 <p className="text-sm font-medium">{option.label}</p>
                               </div>
                             </button>
                           ))}
                         </div>
                       </div>
 
                       <div className="space-y-2">
                         <Label className="text-sm text-muted-foreground">Difficulty</Label>
                         <div className="flex gap-2">
                           {[
                             { level: 1, label: "Easy" },
                             { level: 2, label: "Medium" },
                             { level: 3, label: "Hard" },
                           ].map((d) => (
                             <button
                               key={d.level}
                               onClick={() => updateField("captcha_difficulty", d.level)}
                               className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                                 formData.captcha_difficulty === d.level
                                   ? "bg-primary text-primary-foreground"
                                   : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                               }`}
                             >
                               {d.label}
                             </button>
                           ))}
                         </div>
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
           </div>
         </ScrollArea>
 
         {/* Submit Button */}
         <div className="px-6 py-4 border-t border-border bg-background">
           <Button
             onClick={handleSubmit}
             className="w-full h-12 text-base font-medium"
             disabled={isPending}
           >
             {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Alarm"}
           </Button>
         </div>
       </DialogContent>
     </Dialog>
   );
 };
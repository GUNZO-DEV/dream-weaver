import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useNativeAlarm } from "@/hooks/useNativeAlarm";
import { useAlarmSound, AlarmSoundType } from "@/hooks/useAlarmSound";
import { useAlarmCaptcha, CaptchaType } from "@/hooks/useAlarmCaptcha";
import { useAlarms } from "@/hooks/useAlarms";
import { useAuth } from "@/contexts/AuthContext";
import { FullScreenAlarm } from "@/components/FullScreenAlarm";
import { syncAlarmsToStorage } from "@/lib/alarmStorage";
import { onNativeAlarmSoundFallback } from "@/lib/scheduleNativeAlarms";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AlarmContextType {
  isAlarmRinging: boolean;
  testAlarm: () => void;
}

const AlarmContext = createContext<AlarmContextType>({
  isAlarmRinging: false,
  testAlarm: () => {},
});

export const useAlarmContext = () => useContext(AlarmContext);

export const AlarmProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { alarms } = useAlarms();
  const {
    scheduleAlarm,
    cancelAlarm,
    isNative,
    registerAlarmActions,
    addNotificationListeners,
    requestPermissions,
  } = useNativeAlarm();
  const { playAlarm, stopAlarm: stopAlarmSound } = useAlarmSound();
  const { settings, startAlarm } = useAlarmCaptcha();

  // Tracks the in-flight repeating-snooze notification id so we can cancel
  // the next scheduled ring when the user finally taps Dismiss.
  const repeatingSnoozeIdRef = useRef<number | null>(null);

  const [showAlarm, setShowAlarm] = useState(false);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [activeAlarmConfig, setActiveAlarmConfig] = useState<{
    captchaType: CaptchaType;
    difficulty: number;
    label: string;
    soundId?: AlarmSoundType;
    gradualVolume?: boolean;
    vibrationEnabled?: boolean;
  } | null>(null);

  // Unlock audio on first user interaction (iOS requirement)
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlocked) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const ctx = new AudioContextClass();
          const buffer = ctx.createBuffer(1, 1, 22050);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
          ctx.resume().then(() => setAudioUnlocked(true));
        }
      }
    };
    document.addEventListener("touchstart", unlockAudio, { once: true });
    document.addEventListener("click", unlockAudio, { once: true });
    return () => {
      document.removeEventListener("touchstart", unlockAudio);
      document.removeEventListener("click", unlockAudio);
    };
  }, [audioUnlocked]);

  // Generate a numeric ID from UUID for notifications
  const getNotificationId = useCallback((uuid: string): number => {
    return parseInt(uuid.substring(0, 8), 16) % 100000;
  }, []);

  const stopEverything = useCallback(() => {
    stopAlarmSound();
    if ((window as any).__alarmVibInterval) {
      clearInterval((window as any).__alarmVibInterval);
    }
    if (navigator.vibrate) navigator.vibrate(0);
    setShowAlarm(false);
    setActiveAlarmConfig(null);
    // Cancel any pending repeating snooze so the cycle stops.
    if (repeatingSnoozeIdRef.current !== null) {
      void cancelAlarm(repeatingSnoozeIdRef.current);
      repeatingSnoozeIdRef.current = null;
    }
  }, [stopAlarmSound, cancelAlarm]);

  const handleDismiss = useCallback(() => {
    stopEverything();
    toast.success("Alarm dismissed");
  }, [stopEverything]);

  const scheduleSnooze = useCallback(
    (opts: { repeating: boolean }) => {
      const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
      const snoozeId = Math.floor(Math.random() * 90000) + 10000;
      scheduleAlarm({
        id: snoozeId,
        title: opts.repeating ? "⏰ Snoozed Alarm (repeating)" : "⏰ Snoozed Alarm",
        body: opts.repeating
          ? "Time to wake up! (will keep repeating until dismissed)"
          : "Time to wake up! (snoozed)",
        scheduledAt: snoozeTime,
        sound: "alarm_sound.wav",
        extra: { repeating: opts.repeating },
      });
      if (opts.repeating) {
        repeatingSnoozeIdRef.current = snoozeId;
      }
    },
    [scheduleAlarm]
  );

  const handleSnooze = useCallback(() => {
    stopEverything();
    scheduleSnooze({ repeating: false });
    toast.info("Alarm snoozed for 5 minutes");
  }, [stopEverything, scheduleSnooze]);

  const handleSnoozeRepeat = useCallback(() => {
    stopEverything();
    scheduleSnooze({ repeating: true });
    toast.info("Alarm will repeat every 5 minutes until dismissed");
  }, [stopEverything, scheduleSnooze]);

  const triggerAlarmUI = useCallback(
    (config: {
      captchaType: CaptchaType;
      difficulty: number;
      label: string;
      soundId: AlarmSoundType;
      gradualVolume: boolean;
      vibrationEnabled: boolean;
    }) => {
      startAlarm();
      setActiveAlarmConfig(config);
      setShowAlarm(true);

      if (!isNative) {
        // Fire-and-forget; the hook handles its own fallback chain.
        void playAlarm(config.soundId, config.gradualVolume, config.vibrationEnabled).then((result) => {
          if (!result.ok) {
            toast.error(result.reason || "Alarm sound failed to play");
          } else if (result.fellBack) {
            toast.warning(result.reason || "Using fallback alarm sound");
          }
        });
      } else {
        // Native: vibrate continuously
        const vibrateLoop = () => {
          if (navigator.vibrate) navigator.vibrate([500, 200, 500, 200, 500, 500]);
        };
        vibrateLoop();
        const vibInterval = setInterval(vibrateLoop, 2500);
        (window as any).__alarmVibInterval = vibInterval;
      }
    },
    [isNative, playAlarm, startAlarm]
  );

  const testAlarm = useCallback(() => {
    triggerAlarmUI({
      captchaType: settings.captchaType,
      difficulty: settings.captchaDifficulty,
      label: "Test Alarm",
      soundId: "sunrise",
      gradualVolume: false,
      vibrationEnabled: true,
    });
  }, [settings, triggerAlarmUI]);

  // Set up native notification listeners globally
  useEffect(() => {
    if (!isNative) return;

    registerAlarmActions();
    requestPermissions();

    const cleanup = addNotificationListeners(
      (notification) => {
        console.log("[AlarmProvider] Notification received:", notification);
        const notifAlarmId = notification.extra?.alarmId;
        const foundAlarm = alarms?.find(
          (a) => a.id === notifAlarmId || getNotificationId(a.id) === notifAlarmId
        );

        triggerAlarmUI({
          captchaType: (foundAlarm?.captcha_type as CaptchaType) || "math",
          difficulty: foundAlarm?.captcha_difficulty || 2,
          label: foundAlarm?.label || "Alarm",
          soundId: (foundAlarm?.sound_id as AlarmSoundType) || "sunrise",
          gradualVolume: foundAlarm?.gradual_volume ?? true,
          vibrationEnabled: foundAlarm?.vibration ?? true,
        });
      },
      (action) => {
        // Background actions: this fires the moment the user taps Snooze/Dismiss
        // on the lock screen, even if the app was killed. We must do the
        // minimum work synchronously so the response feels instant.
        console.log("[AlarmProvider] Notification action:", action.actionId);
        if (action.actionId === "snooze") {
          // Schedule a fresh notification 5 min out — no UI required.
          const snoozeTime = new Date(Date.now() + 5 * 60 * 1000);
          const snoozeId = Math.floor(Math.random() * 90000) + 10000;
          scheduleAlarm({
            id: snoozeId,
            title: "⏰ Snoozed Alarm",
            body: "Time to wake up! (snoozed)",
            scheduledAt: snoozeTime,
            sound: "alarm_sound.wav",
          });
          // Stop any in-app ringing if the app happened to be open.
          stopEverything();
        } else if (action.actionId === "dismiss") {
          stopEverything();
        }
      }
    );

    return cleanup;
  }, [
    isNative,
    registerAlarmActions,
    requestPermissions,
    addNotificationListeners,
    alarms,
    getNotificationId,
    triggerAlarmUI,
    handleSnooze,
    handleDismiss,
  ]);

  // Sync alarms to persistent storage for Background Runner
  useEffect(() => {
    if (!alarms || !isNative) return;
    syncAlarmsToStorage(
      alarms.map(a => ({
        id: a.id,
        time: a.time,
        label: a.label,
        days_of_week: a.days_of_week,
        enabled: a.enabled,
      }))
    );
  }, [alarms, isNative]);

  // Surface a user-facing toast whenever the native scheduler had to fall
  // back from the bundled alarm sound to the system default.
  useEffect(() => {
    if (!isNative) return;
    const unsubscribe = onNativeAlarmSoundFallback(({ reason }) => {
      console.warn("[AlarmProvider] Native alarm sound fallback:", reason);
      toast.warning("Alarm sound fallback", { description: reason });
    });
    return unsubscribe;
  }, [isNative]);

  // Server-side alarm triggers via Realtime (works even when app was killed)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('alarm-triggers')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'alarm_triggers',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('[AlarmProvider] Server-side alarm trigger received:', payload);
          const trigger = payload.new as any;
          if (trigger.dismissed) return;

          triggerAlarmUI({
            captchaType: (trigger.captcha_type as CaptchaType) || "math",
            difficulty: trigger.captcha_difficulty || 2,
            label: trigger.label || "Alarm",
            soundId: (trigger.sound_id as AlarmSoundType) || "sunrise",
            gradualVolume: trigger.gradual_volume ?? true,
            vibrationEnabled: trigger.vibration ?? true,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, triggerAlarmUI]);

  // Also check for web-based alarm timing (when app is open but not native)
  useEffect(() => {
    if (isNative || !alarms || !user) return;

    const checkAlarms = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
      const currentDay = now.getDay(); // 0=Sun..6=Sat

      alarms.forEach((alarm) => {
        if (!alarm.enabled) return;
        if (alarm.time !== currentTime) return;
        const days = alarm.days_of_week || [1, 2, 3, 4, 5];
        if (!days.includes(currentDay)) return;
        // Only fire once per minute
        if (now.getSeconds() > 1) return;

        triggerAlarmUI({
          captchaType: (alarm.captcha_type as CaptchaType) || "math",
          difficulty: alarm.captcha_difficulty || 2,
          label: alarm.label || "Alarm",
          soundId: (alarm.sound_id as AlarmSoundType) || "sunrise",
          gradualVolume: alarm.gradual_volume ?? true,
          vibrationEnabled: alarm.vibration ?? true,
        });
      });
    };

    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [isNative, alarms, user, triggerAlarmUI]);

  return (
    <AlarmContext.Provider value={{ isAlarmRinging: showAlarm, testAlarm }}>
      {children}
      {showAlarm && activeAlarmConfig && (
        <FullScreenAlarm
          onDismiss={handleDismiss}
          onSnooze={handleSnooze}
          alarmLabel={activeAlarmConfig.label}
          captchaType={activeAlarmConfig.captchaType}
          difficulty={activeAlarmConfig.difficulty}
          captchaEnabled={true}
        />
      )}
    </AlarmContext.Provider>
  );
};

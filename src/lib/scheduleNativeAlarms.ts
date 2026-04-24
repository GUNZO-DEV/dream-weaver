import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import type { Tables } from '@/integrations/supabase/types';

type Alarm = Tables<'alarms'>;

const ALARM_SOUND_FILE = 'alarm_sound.wav';

// Convert app weekday (0=Sun..6=Sat) to Capacitor weekday (1=Sun..7=Sat)
const toNativeWeekday = (day: number) => day + 1;

// Build a stable per-day numeric ID from a UUID string.
// Notifications need a 32-bit signed int; multiply by 10 + day index.
const baseIdFromUuid = (uuid: string): number => {
  // Take first 7 hex chars to keep base id below ~268M, leaves room for *10+day.
  return parseInt(uuid.substring(0, 7), 16) % 100000000;
};

/**
 * Verify the bundled alarm sound asset is reachable. On native, the file is
 * served from the app bundle's web root, so fetch('/alarm_sound.wav') is a
 * lightweight existence check before we hand the filename to iOS/Android.
 * Cached per session so we don't refetch on every alarm sync.
 */
let _soundAvailability: Promise<{ ok: boolean; error?: string }> | null = null;
export function checkAlarmSoundAvailable(): Promise<{ ok: boolean; error?: string }> {
  if (_soundAvailability) return _soundAvailability;
  _soundAvailability = (async () => {
    try {
      const res = await fetch(`/${ALARM_SOUND_FILE}`, { method: 'HEAD' });
      if (!res.ok) {
        const err = `HTTP ${res.status} fetching ${ALARM_SOUND_FILE}`;
        console.warn('[syncAlarmsToNative]', err);
        return { ok: false, error: err };
      }
      return { ok: true };
    } catch (e: any) {
      const err = e?.message || String(e);
      console.warn('[syncAlarmsToNative] alarm sound preflight failed:', err);
      return { ok: false, error: err };
    }
  })();
  return _soundAvailability;
}

// Allow callers (e.g. AlarmContext) to surface a user-facing toast on fallback.
type FallbackListener = (info: { reason: string }) => void;
const fallbackListeners = new Set<FallbackListener>();
export function onNativeAlarmSoundFallback(listener: FallbackListener): () => void {
  fallbackListeners.add(listener);
  return () => fallbackListeners.delete(listener);
}
function emitFallback(reason: string) {
  fallbackListeners.forEach((l) => {
    try { l({ reason }); } catch { /* ignore */ }
  });
}

/**
 * Cancels every previously-scheduled alarm notification and re-schedules
 * one repeating notification per (alarm × day-of-week) for all currently
 * enabled alarms. Safe to call after any add/update/delete/toggle.
 *
 * On web this is a no-op.
 */
export async function syncAlarmsToNative(alarms: Alarm[] | null | undefined): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[syncAlarmsToNative] Skipping — not native');
    return;
  }

  try {
    // 1. Cancel everything currently pending so stale schedules disappear
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
      console.log('[syncAlarmsToNative] Cancelled', pending.notifications.length, 'pending');
    }

    if (!alarms || alarms.length === 0) {
      console.log('[syncAlarmsToNative] No alarms to schedule');
      return;
    }

    // Pre-flight: confirm bundled sound is reachable. If not, fall back to
    // the system default sound so the alarm is still audible (loud beep).
    const soundCheck = await checkAlarmSoundAvailable();
    const soundFile = soundCheck.ok ? ALARM_SOUND_FILE : undefined;
    if (!soundCheck.ok) {
      const reason = `Custom alarm sound unavailable (${soundCheck.error}). Using system default.`;
      console.error('[syncAlarmsToNative]', reason);
      emitFallback(reason);
    }

    const isIOS = Capacitor.getPlatform() === 'ios';
    const notifications: any[] = [];

    for (const alarm of alarms) {
      if (!alarm.enabled) continue;

      const [hourStr, minuteStr] = alarm.time.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      if (Number.isNaN(hour) || Number.isNaN(minute)) continue;

      const days = (alarm.days_of_week && alarm.days_of_week.length > 0)
        ? alarm.days_of_week
        : [0, 1, 2, 3, 4, 5, 6]; // default: every day

      const baseId = baseIdFromUuid(alarm.id);

      for (const day of days) {
        const weekday = toNativeWeekday(day);
        if (weekday < 1 || weekday > 7) continue;

        const notif: any = {
          id: baseId * 10 + day,
          title: '⏰ ' + (alarm.label || 'Wake Up'),
          body: alarm.label || 'Time to wake up!',
          schedule: {
            on: { weekday, hour, minute },
            repeats: true,
            ...(isIOS ? {} : { allowWhileIdle: true }),
          },
          // soundFile is undefined → iOS/Android use the platform default sound
          ...(soundFile ? { sound: soundFile } : {}),
          actionTypeId: 'ALARM_ACTIONS',
          extra: { alarmId: alarm.id, dayOfWeek: day },
        };

        if (isIOS) {
          notif.threadIdentifier = 'alarms';
          notif.summaryArgument = alarm.label || 'Alarm';
          // Requires the critical-alerts entitlement to bypass silent/DND.
          // Without the entitlement, iOS silently treats it as timeSensitive.
          notif.interruptionLevel = 'critical';
        } else {
          notif.channelId = 'alarm_channel';
          notif.ongoing = true;
          notif.autoCancel = false;
        }

        notifications.push(notif);
      }
    }

    if (notifications.length === 0) {
      console.log('[syncAlarmsToNative] Nothing to schedule (all disabled)');
      return;
    }

    try {
      const result = await LocalNotifications.schedule({ notifications });
      console.log('[syncAlarmsToNative] Scheduled', notifications.length, 'notifications:', result);
    } catch (scheduleErr: any) {
      // If scheduling failed and we WERE using the custom sound, retry once
      // with the system default — the most likely cause is a missing/invalid
      // sound asset in the iOS bundle.
      const msg = scheduleErr?.message || String(scheduleErr);
      console.error('[syncAlarmsToNative] schedule() failed:', msg);
      if (soundFile) {
        const reason = `Scheduling with "${soundFile}" failed (${msg}). Retrying with system default sound.`;
        console.warn('[syncAlarmsToNative]', reason);
        emitFallback(reason);
        const fallbackNotifs = notifications.map((n) => {
          const { sound, ...rest } = n;
          return rest;
        });
        try {
          const result = await LocalNotifications.schedule({ notifications: fallbackNotifs });
          console.log('[syncAlarmsToNative] Fallback scheduled', fallbackNotifs.length, 'notifications:', result);
        } catch (retryErr: any) {
          const retryMsg = retryErr?.message || String(retryErr);
          console.error('[syncAlarmsToNative] Fallback schedule also failed:', retryMsg);
          emitFallback(`Failed to schedule alarms even with default sound: ${retryMsg}`);
          throw retryErr;
        }
      } else {
        throw scheduleErr;
      }
    }
  } catch (err) {
    console.error('[syncAlarmsToNative] Failed:', err);
  }
}

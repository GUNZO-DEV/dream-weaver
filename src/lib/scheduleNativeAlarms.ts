import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import type { Tables } from '@/integrations/supabase/types';

type Alarm = Tables<'alarms'>;

// Convert app weekday (0=Sun..6=Sat) to Capacitor weekday (1=Sun..7=Sat)
const toNativeWeekday = (day: number) => day + 1;

// Build a stable per-day numeric ID from a UUID string.
// Notifications need a 32-bit signed int; multiply by 10 + day index.
const baseIdFromUuid = (uuid: string): number => {
  // Take first 7 hex chars to keep base id below ~268M, leaves room for *10+day.
  return parseInt(uuid.substring(0, 7), 16) % 100000000;
};

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
          sound: 'alarm_sound.wav',
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

    const result = await LocalNotifications.schedule({ notifications });
    console.log('[syncAlarmsToNative] Scheduled', notifications.length, 'notifications:', result);
  } catch (err) {
    console.error('[syncAlarmsToNative] Failed:', err);
  }
}

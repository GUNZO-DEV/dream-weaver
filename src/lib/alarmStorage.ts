import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

export interface StoredAlarm {
  id: string;
  time: string;
  label: string | null;
  days_of_week: number[] | null;
  enabled: boolean | null;
}

/**
 * Sync alarms to Capacitor Preferences so the Background Runner
 * can read them when the app is killed.
 */
export const syncAlarmsToStorage = async (alarms: StoredAlarm[]) => {
  if (!Capacitor.isNativePlatform()) return;

  try {
    const enabledAlarms = alarms.filter(a => a.enabled);
    await Preferences.set({
      key: 'active_alarms',
      value: JSON.stringify(enabledAlarms),
    });
    console.log('[AlarmStorage] Synced', enabledAlarms.length, 'alarms to storage');
  } catch (error) {
    console.error('[AlarmStorage] Failed to sync alarms:', error);
  }
};

export const clearAlarmStorage = async () => {
  if (!Capacitor.isNativePlatform()) return;
  await Preferences.remove({ key: 'active_alarms' });
};

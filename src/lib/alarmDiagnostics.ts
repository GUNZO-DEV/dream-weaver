// Lightweight on-device diagnostics log for alarm trigger paths.
// Persists to Capacitor Preferences (falls back to localStorage on web).
// Capped to MAX_ENTRIES so it never grows unbounded.

import { Preferences } from "@capacitor/preferences";

export type AlarmTriggerSource =
  | "native-notification" // LocalNotifications listener fired
  | "realtime"            // Supabase Realtime alarm_triggers row
  | "web-interval"        // Web fallback setInterval check
  | "test"                // Manual Test Alarm button
  | "snooze-repeat";      // Auto-rescheduled by repeating snooze cycle

export interface AlarmDiagnosticEntry {
  id: string;
  timestamp: number; // epoch ms
  source: AlarmTriggerSource;
  label?: string;
  alarmId?: string | number;
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = "alarm_diagnostics_log_v1";
const MAX_ENTRIES = 200;

let cache: AlarmDiagnosticEntry[] | null = null;
const listeners = new Set<(entries: AlarmDiagnosticEntry[]) => void>();

const safeParse = (raw: string | null): AlarmDiagnosticEntry[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readRaw = async (): Promise<string | null> => {
  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });
    return value;
  } catch {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }
};

const writeRaw = async (value: string): Promise<void> => {
  try {
    await Preferences.set({ key: STORAGE_KEY, value });
  } catch {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      /* noop */
    }
  }
};

const removeRaw = async (): Promise<void> => {
  try {
    await Preferences.remove({ key: STORAGE_KEY });
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }
};

const notify = () => {
  const snapshot = cache ? [...cache] : [];
  listeners.forEach((l) => {
    try {
      l(snapshot);
    } catch (err) {
      console.error("[alarmDiagnostics] listener error:", err);
    }
  });
};

export const loadAlarmDiagnostics = async (): Promise<AlarmDiagnosticEntry[]> => {
  if (cache) return [...cache];
  const raw = await readRaw();
  cache = safeParse(raw);
  return [...cache];
};

export const logAlarmTrigger = (
  source: AlarmTriggerSource,
  details?: { label?: string; alarmId?: string | number; meta?: Record<string, unknown> }
): void => {
  const entry: AlarmDiagnosticEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    source,
    label: details?.label,
    alarmId: details?.alarmId,
    meta: details?.meta,
  };

  // Tagged console line for Xcode / Android Studio logcat searching.
  console.log(
    `[AlarmDiag] source=${source} label=${entry.label ?? "-"} alarmId=${entry.alarmId ?? "-"}`,
    entry.meta ?? ""
  );

  // Update cache synchronously so the UI can render immediately,
  // then persist asynchronously in the background.
  const next = cache ? [entry, ...cache] : [entry];
  if (next.length > MAX_ENTRIES) next.length = MAX_ENTRIES;
  cache = next;
  notify();

  void writeRaw(JSON.stringify(next)).catch((err) =>
    console.error("[alarmDiagnostics] persist failed:", err)
  );
};

export const clearAlarmDiagnostics = async (): Promise<void> => {
  cache = [];
  notify();
  await removeRaw();
};

export const subscribeAlarmDiagnostics = (
  listener: (entries: AlarmDiagnosticEntry[]) => void
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

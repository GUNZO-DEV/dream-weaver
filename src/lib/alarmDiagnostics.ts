// Lightweight on-device diagnostics log for alarm trigger paths.
// Persists to Capacitor Preferences (falls back to localStorage on web).
// Capped to MAX_ENTRIES so it never grows unbounded.

import { Preferences } from "@capacitor/preferences";
import { Device } from "@capacitor/device";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

export type AlarmTriggerSource =
  | "native-notification" // LocalNotifications listener fired
  | "realtime"            // Supabase Realtime alarm_triggers row
  | "web-interval"        // Web fallback setInterval check
  | "test"                // Manual Test Alarm button
  | "snooze-repeat";      // Auto-rescheduled by repeating snooze cycle

export interface DeviceContext {
  platform: string;       // 'ios' | 'android' | 'web'
  osVersion?: string;
  model?: string;         // e.g. 'iPhone15,3'
  manufacturer?: string;
  appVersion?: string;    // e.g. '1.0.0'
  appBuild?: string;      // e.g. '42'
  webViewVersion?: string;
  timezone: string;       // IANA, e.g. 'Europe/Paris'
  locale?: string;
}

export interface AlarmDiagnosticEntry {
  id: string;
  timestamp: number; // epoch ms
  source: AlarmTriggerSource;
  label?: string;
  alarmId?: string | number;
  meta?: Record<string, unknown>;
  context?: DeviceContext;
}

const STORAGE_KEY = "alarm_diagnostics_log_v1";
const MAX_ENTRIES = 200;

let contextCache: DeviceContext | null = null;
let contextPromise: Promise<DeviceContext> | null = null;

const getTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const getLocale = (): string | undefined => {
  try {
    return navigator.language;
  } catch {
    return undefined;
  }
};

// Resolve device + build info once. Safe on web (Capacitor plugins
// gracefully return browser fallbacks).
const resolveDeviceContext = async (): Promise<DeviceContext> => {
  const fallback: DeviceContext = {
    platform: Capacitor.getPlatform(),
    timezone: getTimezone(),
    locale: getLocale(),
  };

  try {
    const [info, appInfo] = await Promise.all([
      Device.getInfo().catch(() => null),
      // App.getInfo only works on native; calling on web throws.
      Capacitor.isNativePlatform() ? App.getInfo().catch(() => null) : Promise.resolve(null),
    ]);

    return {
      ...fallback,
      osVersion: info?.osVersion,
      model: info?.model,
      manufacturer: info?.manufacturer,
      webViewVersion: info?.webViewVersion,
      appVersion: appInfo?.version,
      appBuild: appInfo?.build,
    };
  } catch (err) {
    console.warn("[alarmDiagnostics] device context unavailable:", err);
    return fallback;
  }
};

export const getDeviceContext = (): Promise<DeviceContext> => {
  if (contextCache) return Promise.resolve(contextCache);
  if (contextPromise) return contextPromise;
  contextPromise = resolveDeviceContext().then((ctx) => {
    contextCache = ctx;
    // Back-patch any cached entries that were logged before context resolved
    // (including entries loaded from a previous session's persisted log).
    void backPatchMissingContext(ctx);
    return ctx;
  });
  return contextPromise;
};

// Eagerly start resolving so the first log entry usually has full context.
void getDeviceContext();

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
    // Attach cached device/build context if it's already resolved. If not,
    // the entry will be patched in once it resolves (see below).
    context: contextCache ?? undefined,
  };

  // Tagged console line for Xcode / Android Studio logcat searching.
  console.log(
    `[AlarmDiag] source=${source} label=${entry.label ?? "-"} alarmId=${entry.alarmId ?? "-"} ` +
      `platform=${entry.context?.platform ?? "?"} app=${entry.context?.appVersion ?? "?"}` +
      `(${entry.context?.appBuild ?? "?"}) os=${entry.context?.osVersion ?? "?"} ` +
      `tz=${entry.context?.timezone ?? "?"}`,
    entry.meta ?? ""
  );

  // Update cache synchronously so the UI can render immediately,
  // then persist asynchronously in the background.
  const next = cache ? [entry, ...cache] : [entry];
  if (next.length > MAX_ENTRIES) next.length = MAX_ENTRIES;
  cache = next;
  notify();

  const persist = (entries: AlarmDiagnosticEntry[]) =>
    writeRaw(JSON.stringify(entries)).catch((err) =>
      console.error("[alarmDiagnostics] persist failed:", err)
    );

  void persist(next);

  // If context wasn't ready yet, patch this entry as soon as it resolves so
  // troubleshooting still has full device info.
  if (!entry.context) {
    void getDeviceContext().then((ctx) => {
      if (!cache) return;
      const idx = cache.findIndex((e) => e.id === entry.id);
      if (idx === -1) return;
      const patched = [...cache];
      patched[idx] = { ...patched[idx], context: ctx };
      cache = patched;
      notify();
      void persist(patched);
    });
  }
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

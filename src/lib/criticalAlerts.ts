import { Capacitor, registerPlugin } from "@capacitor/core";

export type CriticalAuthStatus =
  | "notDetermined"
  | "denied"
  | "authorized"
  | "provisional"
  | "ephemeral"
  | "unknown";

export type CriticalSetting = "notSupported" | "disabled" | "enabled" | "unknown";

export interface CriticalAlertsStatus {
  authorization: CriticalAuthStatus;
  critical: CriticalSetting;
  alert?: CriticalSetting;
  sound?: CriticalSetting;
  lockScreen?: CriticalSetting;
  notificationCenter?: CriticalSetting;
}

export interface CriticalAlertsRequestResult {
  granted: boolean;
  authorization: CriticalAuthStatus;
  critical: CriticalSetting;
}

interface CriticalAlertsPlugin {
  checkStatus(): Promise<CriticalAlertsStatus>;
  requestCritical(): Promise<CriticalAlertsRequestResult>;
  openSettings(): Promise<{ opened: boolean; fallback?: boolean }>;
}

const NativeCriticalAlerts = registerPlugin<CriticalAlertsPlugin>("CriticalAlerts");

/**
 * Whether the dedicated Critical Alerts native bridge is available.
 * Returns false on web and on Android (entitlement is iOS-only).
 */
export const isCriticalAlertsSupported = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
};

/**
 * Reads the current Critical Alerts entitlement status from iOS.
 * Falls back to a "notSupported" result when running outside iOS or
 * when the native plugin is not yet linked into the app binary.
 */
export const checkCriticalAlertsStatus = async (): Promise<CriticalAlertsStatus> => {
  if (!isCriticalAlertsSupported()) {
    return { authorization: "unknown", critical: "notSupported" };
  }
  try {
    return await NativeCriticalAlerts.checkStatus();
  } catch (err) {
    console.warn("[CriticalAlerts] checkStatus failed", err);
    return { authorization: "unknown", critical: "unknown" };
  }
};

/**
 * Requests Critical Alerts authorization from iOS, then re-reads the
 * resulting setting so callers know if the entitlement was actually
 * granted (versus only the generic alert permission).
 */
export const requestCriticalAlerts = async (): Promise<CriticalAlertsRequestResult> => {
  if (!isCriticalAlertsSupported()) {
    return { granted: false, authorization: "unknown", critical: "notSupported" };
  }
  try {
    return await NativeCriticalAlerts.requestCritical();
  } catch (err) {
    console.warn("[CriticalAlerts] requestCritical failed", err);
    return { granted: false, authorization: "unknown", critical: "unknown" };
  }
};

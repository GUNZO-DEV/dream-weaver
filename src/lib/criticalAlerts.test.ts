import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// vi.mock factories run before module-level `let`s are initialized, so we
// declare shared mock state through vi.hoisted to make it available early.
const mocks = vi.hoisted(() => {
  const state: {
    platform: "ios" | "android" | "web";
    isNative: boolean;
    plugin: {
      checkStatus: ReturnType<typeof import("vitest").vi.fn>;
      requestCritical: ReturnType<typeof import("vitest").vi.fn>;
      openSettings: ReturnType<typeof import("vitest").vi.fn>;
    };
  } = {
    platform: "ios",
    isNative: true,
    plugin: {
      checkStatus: (globalThis as any).vi?.fn?.() ?? (() => {}),
      requestCritical: (globalThis as any).vi?.fn?.() ?? (() => {}),
      openSettings: (globalThis as any).vi?.fn?.() ?? (() => {}),
    },
  };
  return state;
});

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => mocks.isNative,
    getPlatform: () => mocks.platform,
  },
  registerPlugin: () => mocks.plugin,
}));

// Import AFTER the mock is registered so the module wires up to it.
import {
  checkCriticalAlertsStatus,
  requestCriticalAlerts,
  isCriticalAlertsSupported,
  openIosNotificationSettings,
} from "@/lib/criticalAlerts";

const resetPluginMocks = () => {
  mocks.plugin.checkStatus = vi.fn();
  mocks.plugin.requestCritical = vi.fn();
  mocks.plugin.openSettings = vi.fn();
};

describe("criticalAlerts wrapper", () => {
  beforeEach(() => {
    mocks.platform = "ios";
    mocks.isNative = true;
    resetPluginMocks();
    // Silence console.warn noise from expected error paths
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isCriticalAlertsSupported", () => {
    it("returns true on native iOS", () => {
      mocks.isNative = true;
      mocks.platform = "ios";
      expect(isCriticalAlertsSupported()).toBe(true);
    });

    it("returns false on Android (entitlement is iOS-only)", () => {
      mocks.isNative = true;
      mocks.platform = "android";
      expect(isCriticalAlertsSupported()).toBe(false);
    });

    it("returns false on web", () => {
      mocks.isNative = false;
      mocks.platform = "web";
      expect(isCriticalAlertsSupported()).toBe(false);
    });
  });

  describe("checkCriticalAlertsStatus", () => {
    it("returns notSupported fallback on web without invoking native", async () => {
      mocks.isNative = false;
      mocks.platform = "web";
      const result = await checkCriticalAlertsStatus();
      expect(result).toEqual({ authorization: "unknown", critical: "notSupported" });
      expect(mocks.plugin.checkStatus).not.toHaveBeenCalled();
    });

    it("returns notSupported fallback on Android without invoking native", async () => {
      mocks.isNative = true;
      mocks.platform = "android";
      const result = await checkCriticalAlertsStatus();
      expect(result.critical).toBe("notSupported");
      expect(mocks.plugin.checkStatus).not.toHaveBeenCalled();
    });

    it("maps an enabled critical setting from iOS through unchanged", async () => {
      mocks.plugin.checkStatus.mockResolvedValueOnce({
        authorization: "authorized",
        critical: "enabled",
        alert: "enabled",
        sound: "enabled",
        lockScreen: "enabled",
        notificationCenter: "enabled",
      });
      const result = await checkCriticalAlertsStatus();
      expect(result.critical).toBe("enabled");
      expect(result.authorization).toBe("authorized");
      expect(mocks.plugin.checkStatus).toHaveBeenCalledTimes(1);
    });

    it("maps a disabled critical setting from iOS through unchanged", async () => {
      mocks.plugin.checkStatus.mockResolvedValueOnce({
        authorization: "authorized",
        critical: "disabled",
      });
      const result = await checkCriticalAlertsStatus();
      expect(result.critical).toBe("disabled");
      expect(result.authorization).toBe("authorized");
    });

    it("maps a notSupported critical setting from iOS (entitlement missing)", async () => {
      mocks.plugin.checkStatus.mockResolvedValueOnce({
        authorization: "authorized",
        critical: "notSupported",
      });
      const result = await checkCriticalAlertsStatus();
      expect(result.critical).toBe("notSupported");
    });

    it("returns unknown fallback when the native call rejects on iOS", async () => {
      mocks.plugin.checkStatus.mockRejectedValueOnce(new Error("plugin not linked"));
      const result = await checkCriticalAlertsStatus();
      expect(result).toEqual({ authorization: "unknown", critical: "unknown" });
    });
  });

  describe("requestCriticalAlerts", () => {
    it("returns notSupported fallback on web without invoking native", async () => {
      mocks.isNative = false;
      mocks.platform = "web";
      const result = await requestCriticalAlerts();
      expect(result).toEqual({ granted: false, authorization: "unknown", critical: "notSupported" });
      expect(mocks.plugin.requestCritical).not.toHaveBeenCalled();
    });

    it("propagates a granted + enabled response from iOS", async () => {
      mocks.plugin.requestCritical.mockResolvedValueOnce({
        granted: true,
        authorization: "authorized",
        critical: "enabled",
      });
      const result = await requestCriticalAlerts();
      expect(result.granted).toBe(true);
      expect(result.critical).toBe("enabled");
    });

    it("reports critical disabled even when generic auth was granted", async () => {
      mocks.plugin.requestCritical.mockResolvedValueOnce({
        granted: true,
        authorization: "authorized",
        critical: "disabled",
      });
      const result = await requestCriticalAlerts();
      // The whole point of this wrapper: distinguish notification auth
      // from the actual Critical Alerts entitlement state.
      expect(result.granted).toBe(true);
      expect(result.critical).toBe("disabled");
    });

    it("returns unknown fallback when the native call rejects", async () => {
      mocks.plugin.requestCritical.mockRejectedValueOnce(new Error("boom"));
      const result = await requestCriticalAlerts();
      expect(result).toEqual({ granted: false, authorization: "unknown", critical: "unknown" });
    });
  });

  describe("openIosNotificationSettings", () => {
    it("returns false on web without invoking native", async () => {
      mocks.isNative = false;
      mocks.platform = "web";
      const opened = await openIosNotificationSettings();
      expect(opened).toBe(false);
      expect(mocks.plugin.openSettings).not.toHaveBeenCalled();
    });

    it("returns true when native reports opened", async () => {
      mocks.plugin.openSettings.mockResolvedValueOnce({ opened: true });
      const opened = await openIosNotificationSettings();
      expect(opened).toBe(true);
    });

    it("returns false when native reports not opened", async () => {
      mocks.plugin.openSettings.mockResolvedValueOnce({ opened: false });
      const opened = await openIosNotificationSettings();
      expect(opened).toBe(false);
    });

    it("returns false when native call rejects", async () => {
      mocks.plugin.openSettings.mockRejectedValueOnce(new Error("nope"));
      const opened = await openIosNotificationSettings();
      expect(opened).toBe(false);
    });
  });
});

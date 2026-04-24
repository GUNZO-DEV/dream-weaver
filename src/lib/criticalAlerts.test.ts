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
    mockPlatform = "ios";
    mockIsNative = true;
    resetPluginMocks();
    // Silence console.warn noise from expected error paths
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("isCriticalAlertsSupported", () => {
    it("returns true on native iOS", () => {
      mockIsNative = true;
      mockPlatform = "ios";
      expect(isCriticalAlertsSupported()).toBe(true);
    });

    it("returns false on Android (entitlement is iOS-only)", () => {
      mockIsNative = true;
      mockPlatform = "android";
      expect(isCriticalAlertsSupported()).toBe(false);
    });

    it("returns false on web", () => {
      mockIsNative = false;
      mockPlatform = "web";
      expect(isCriticalAlertsSupported()).toBe(false);
    });
  });

  describe("checkCriticalAlertsStatus", () => {
    it("returns notSupported fallback on web without invoking native", async () => {
      mockIsNative = false;
      mockPlatform = "web";
      const result = await checkCriticalAlertsStatus();
      expect(result).toEqual({ authorization: "unknown", critical: "notSupported" });
      expect(mockPlugin.checkStatus).not.toHaveBeenCalled();
    });

    it("returns notSupported fallback on Android without invoking native", async () => {
      mockIsNative = true;
      mockPlatform = "android";
      const result = await checkCriticalAlertsStatus();
      expect(result.critical).toBe("notSupported");
      expect(mockPlugin.checkStatus).not.toHaveBeenCalled();
    });

    it("maps an enabled critical setting from iOS through unchanged", async () => {
      mockPlugin.checkStatus.mockResolvedValueOnce({
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
      expect(mockPlugin.checkStatus).toHaveBeenCalledTimes(1);
    });

    it("maps a disabled critical setting from iOS through unchanged", async () => {
      mockPlugin.checkStatus.mockResolvedValueOnce({
        authorization: "authorized",
        critical: "disabled",
      });
      const result = await checkCriticalAlertsStatus();
      expect(result.critical).toBe("disabled");
      expect(result.authorization).toBe("authorized");
    });

    it("maps a notSupported critical setting from iOS (entitlement missing)", async () => {
      mockPlugin.checkStatus.mockResolvedValueOnce({
        authorization: "authorized",
        critical: "notSupported",
      });
      const result = await checkCriticalAlertsStatus();
      expect(result.critical).toBe("notSupported");
    });

    it("returns unknown fallback when the native call rejects on iOS", async () => {
      mockPlugin.checkStatus.mockRejectedValueOnce(new Error("plugin not linked"));
      const result = await checkCriticalAlertsStatus();
      expect(result).toEqual({ authorization: "unknown", critical: "unknown" });
    });
  });

  describe("requestCriticalAlerts", () => {
    it("returns notSupported fallback on web without invoking native", async () => {
      mockIsNative = false;
      mockPlatform = "web";
      const result = await requestCriticalAlerts();
      expect(result).toEqual({ granted: false, authorization: "unknown", critical: "notSupported" });
      expect(mockPlugin.requestCritical).not.toHaveBeenCalled();
    });

    it("propagates a granted + enabled response from iOS", async () => {
      mockPlugin.requestCritical.mockResolvedValueOnce({
        granted: true,
        authorization: "authorized",
        critical: "enabled",
      });
      const result = await requestCriticalAlerts();
      expect(result.granted).toBe(true);
      expect(result.critical).toBe("enabled");
    });

    it("reports critical disabled even when generic auth was granted", async () => {
      mockPlugin.requestCritical.mockResolvedValueOnce({
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
      mockPlugin.requestCritical.mockRejectedValueOnce(new Error("boom"));
      const result = await requestCriticalAlerts();
      expect(result).toEqual({ granted: false, authorization: "unknown", critical: "unknown" });
    });
  });

  describe("openIosNotificationSettings", () => {
    it("returns false on web without invoking native", async () => {
      mockIsNative = false;
      mockPlatform = "web";
      const opened = await openIosNotificationSettings();
      expect(opened).toBe(false);
      expect(mockPlugin.openSettings).not.toHaveBeenCalled();
    });

    it("returns true when native reports opened", async () => {
      mockPlugin.openSettings.mockResolvedValueOnce({ opened: true });
      const opened = await openIosNotificationSettings();
      expect(opened).toBe(true);
    });

    it("returns false when native reports not opened", async () => {
      mockPlugin.openSettings.mockResolvedValueOnce({ opened: false });
      const opened = await openIosNotificationSettings();
      expect(opened).toBe(false);
    });

    it("returns false when native call rejects", async () => {
      mockPlugin.openSettings.mockRejectedValueOnce(new Error("nope"));
      const opened = await openIosNotificationSettings();
      expect(opened).toBe(false);
    });
  });
});

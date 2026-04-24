import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We mock @capacitor/core so the module under test sees a controllable
// platform + plugin. registerPlugin is mocked to return whatever the
// current __mockPlugin holds, letting individual tests inject behavior.
let mockPlatform: "ios" | "android" | "web" = "ios";
let mockIsNative = true;
let mockPlugin: {
  checkStatus: ReturnType<typeof vi.fn>;
  requestCritical: ReturnType<typeof vi.fn>;
  openSettings: ReturnType<typeof vi.fn>;
} = {
  checkStatus: vi.fn(),
  requestCritical: vi.fn(),
  openSettings: vi.fn(),
};

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: () => mockIsNative,
    getPlatform: () => mockPlatform,
  },
  registerPlugin: () => mockPlugin,
}));

// Import AFTER the mock is registered so the module wires up to it.
import {
  checkCriticalAlertsStatus,
  requestCriticalAlerts,
  isCriticalAlertsSupported,
  openIosNotificationSettings,
} from "@/lib/criticalAlerts";

const resetPluginMocks = () => {
  mockPlugin = {
    checkStatus: vi.fn(),
    requestCritical: vi.fn(),
    openSettings: vi.fn(),
  };
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

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellRing, CheckCircle2, XCircle, Loader2, ShieldAlert, Settings as SettingsIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { storageGet, storageSet } from "@/lib/capacitorStorage";
import { toast } from "sonner";
import {
  checkCriticalAlertsStatus,
  requestCriticalAlerts,
  isCriticalAlertsSupported,
  openIosNotificationSettings,
  type CriticalSetting,
} from "@/lib/criticalAlerts";

const ONBOARDING_KEY = "permission_onboarding_complete_v1";

type StepStatus = "idle" | "pending" | "granted" | "denied" | "unsupported";

interface StepState {
  notifications: StepStatus;
  critical: StepStatus;
  criticalDetail: CriticalSetting | null;
}

export const PermissionOnboarding = () => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"intro" | "notifications" | "critical" | "done">("intro");
  const [status, setStatus] = useState<StepState>({ notifications: "idle", critical: "idle", criticalDetail: null });

  // Decide whether to show the onboarding on first launch (native only).
  // We also pre-load the real Critical Alerts entitlement state from iOS so
  // the UI reflects the actual status, not just the generic notification flag.
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      if (!Capacitor.isNativePlatform()) return;
      try {
        // Pre-fill critical status from native side regardless of onboarding state
        const critical = await checkCriticalAlertsStatus();
        if (!cancelled) {
          setStatus((s) => ({
            ...s,
            criticalDetail: critical.critical,
            critical:
              critical.critical === "enabled"
                ? "granted"
                : critical.critical === "notSupported"
                ? "unsupported"
                : s.critical,
          }));
        }

        const seen = await storageGet(ONBOARDING_KEY);
        if (seen === "1") return;
        // If display + critical are both already in a final state, mark complete silently
        const current = await LocalNotifications.checkPermissions();
        if (current.display === "granted" && critical.critical !== "unknown") {
          await storageSet(ONBOARDING_KEY, "1");
          return;
        }
        if (!cancelled) setOpen(true);
      } catch (err) {
        console.warn("[PermissionOnboarding] init failed", err);
      }
    };
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const requestNotifications = async () => {
    setStatus((s) => ({ ...s, notifications: "pending" }));
    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === "granted";
      setStatus((s) => ({ ...s, notifications: granted ? "granted" : "denied" }));
      if (granted) {
        toast.success("Notifications allowed", { description: "Alarms can appear on the lock screen." });
      } else {
        toast.error("Notifications denied", { description: "Enable later in iOS Settings → Notifications → SleepWell." });
      }
      // Move to critical step regardless, so users always see the explanation
      setTimeout(() => setStep("critical"), 700);
    } catch (err) {
      console.error("[PermissionOnboarding] notifications request failed", err);
      setStatus((s) => ({ ...s, notifications: "denied" }));
      toast.error("Notifications request failed", { description: "Please try again from Settings." });
      setTimeout(() => setStep("critical"), 700);
    }
  };

  const requestCritical = async () => {
    // Skip cleanly on platforms without the entitlement (Android / web)
    if (!isCriticalAlertsSupported()) {
      setStatus((s) => ({ ...s, critical: "unsupported", criticalDetail: "notSupported" }));
      toast("Critical Alerts unavailable", {
        description: "This entitlement is iOS-only and not active on this device.",
      });
      setTimeout(() => setStep("done"), 700);
      return;
    }

    setStatus((s) => ({ ...s, critical: "pending" }));
    try {
      const result = await requestCriticalAlerts();
      const isEnabled = result.critical === "enabled";
      const isUnsupported = result.critical === "notSupported";

      if (isUnsupported) {
        setStatus((s) => ({ ...s, critical: "unsupported", criticalDetail: result.critical }));
        toast.error("Critical Alerts entitlement missing", {
          description: "Add the Critical Alerts entitlement in Xcode and rebuild the app.",
        });
      } else if (isEnabled) {
        setStatus((s) => ({ ...s, critical: "granted", criticalDetail: result.critical }));
        toast.success("Critical Alerts enabled", {
          description: "Alarms will bypass Silent, Do Not Disturb, and Focus.",
        });
      } else {
        setStatus((s) => ({ ...s, critical: "denied", criticalDetail: result.critical }));
        toast.error("Critical Alerts not enabled", {
          description: "Enable in Settings → Notifications → SleepWell → Critical Alerts.",
        });
      }
      setTimeout(() => setStep("done"), 700);
    } catch (err) {
      console.error("[PermissionOnboarding] critical request failed", err);
      setStatus((s) => ({ ...s, critical: "denied", criticalDetail: "unknown" }));
      toast.error("Critical Alerts request failed", { description: "Please try again from Settings." });
      setTimeout(() => setStep("done"), 700);
    }
  };

  const finish = async () => {
    try {
      await storageSet(ONBOARDING_KEY, "1");
    } catch (err) {
      console.warn("[PermissionOnboarding] failed to persist completion", err);
    }
    setOpen(false);
  };

  const openSettings = async () => {
    const opened = await openIosNotificationSettings();
    if (!opened) {
      toast.error("Couldn't open Settings", {
        description: "Open the iOS Settings app manually and find SleepWell → Notifications.",
      });
    }
  };

  const OpenSettingsButton = ({ label = "Open iOS Settings" }: { label?: string }) => (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 gap-2"
      onClick={openSettings}
    >
      <SettingsIcon size={16} />
      {label}
    </Button>
  );

  const StatusBadge = ({ value, label }: { value: StepStatus; label?: string }) => {
    if (value === "granted") {
      return (
        <div className="flex items-center gap-2 text-sm text-primary">
          <CheckCircle2 size={16} />
          <span>{label ?? "Allowed"}</span>
        </div>
      );
    }
    if (value === "denied") {
      return (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <XCircle size={16} />
          <span>Not allowed</span>
        </div>
      );
    }
    if (value === "unsupported") {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldAlert size={16} />
          <span>Entitlement missing</span>
        </div>
      );
    }
    if (value === "pending") {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          <span>Waiting for response…</span>
        </div>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) finish(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-background">
        <div className="px-6 pt-6 pb-2">
          <DialogHeader>
            <DialogTitle className="text-xl">Wake-up permissions</DialogTitle>
            <DialogDescription>
              SleepWell needs a couple of permissions so your alarms can ring even when your phone is silent or locked.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 pt-4 space-y-4">
          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
                    <Bell size={20} />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Step 1 · Notifications</p>
                    <p className="text-muted-foreground mt-1">
                      Lets your alarms appear on the lock screen and play their sound.
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center text-destructive shrink-0">
                    <BellRing size={20} />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Step 2 · Critical Alerts</p>
                    <p className="text-muted-foreground mt-1">
                      Required to bypass Silent mode, Do Not Disturb, and Focus.
                    </p>
                  </div>
                </div>
                <Button className="w-full h-11" onClick={() => { setStep("notifications"); requestNotifications(); }}>
                  Get started
                </Button>
                <button onClick={finish} className="w-full text-xs text-muted-foreground hover:text-foreground">
                  Skip for now
                </button>
              </motion.div>
            )}

            {step === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-border/40 bg-secondary/30 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
                      <Bell size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Notifications</p>
                      <p className="text-xs text-muted-foreground">Allow alerts so alarms can fire on the lock screen.</p>
                    </div>
                  </div>
                  <StatusBadge value={status.notifications} />
                  {status.notifications === "denied" && (
                    <p className="text-xs text-muted-foreground">
                      You can still enable this later in iOS Settings → Notifications → SleepWell.
                    </p>
                  )}
                </div>
                {status.notifications === "denied" && <OpenSettingsButton label="Enable in iOS Settings" />}
                <Button
                  className="w-full h-11"
                  variant="secondary"
                  onClick={() => setStep("critical")}
                  disabled={status.notifications === "pending"}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {step === "critical" && (
              <motion.div
                key="critical"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-border/40 bg-secondary/30 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center text-destructive">
                      <ShieldAlert size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Critical Alerts</p>
                      <p className="text-xs text-muted-foreground">Bypass Silent, Do Not Disturb, and Focus modes.</p>
                    </div>
                  </div>
                  <StatusBadge
                    value={status.critical}
                    label={status.critical === "granted" ? "Entitlement active" : undefined}
                  />
                  {status.critical === "denied" && (
                    <p className="text-xs text-muted-foreground">
                      iOS notifications are on, but Critical Alerts is off. Enable it in Settings → Notifications → SleepWell → Critical Alerts.
                    </p>
                  )}
                  {status.critical === "unsupported" && (
                    <p className="text-xs text-muted-foreground">
                      The Critical Alerts entitlement is not enabled in this build. Add it in Xcode (Signing & Capabilities) and rebuild.
                    </p>
                  )}
                  {status.critical === "granted" && (
                    <p className="text-xs text-muted-foreground">
                      Verified directly with iOS — alarms can override Silent and Focus modes.
                    </p>
                  )}
                </div>
                <Button
                  className="w-full h-11"
                  onClick={requestCritical}
                  disabled={
                    status.critical === "pending" ||
                    status.critical === "granted" ||
                    status.critical === "unsupported"
                  }
                >
                  {status.critical === "granted"
                    ? "Already enabled"
                    : status.critical === "unsupported"
                    ? "Unavailable on this device"
                    : "Allow Critical Alerts"}
                </Button>
                {(status.critical === "denied" || status.critical === "unsupported") && (
                  <OpenSettingsButton label="Enable in iOS Settings" />
                )}
                <button onClick={() => setStep("done")} className="w-full text-xs text-muted-foreground hover:text-foreground">
                  Skip this step
                </button>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="space-y-4"
              >
                <div className="rounded-2xl border border-border/40 bg-secondary/30 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Bell size={16} className="text-primary" />
                      Notifications
                    </div>
                    <StatusBadge value={status.notifications} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <ShieldAlert size={16} className="text-destructive" />
                      Critical Alerts
                    </div>
                    <StatusBadge value={status.critical} />
                  </div>
                </div>
                {status.notifications !== "granted" && (
                  <p className="text-xs text-muted-foreground">
                    Without notifications, alarms will only ring while the app is open.
                  </p>
                )}
                <Button className="w-full h-11" onClick={finish}>
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};
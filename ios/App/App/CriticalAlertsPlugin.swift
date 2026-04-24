import Foundation
import Capacitor
import UIKit
import UserNotifications

// Custom Capacitor plugin that exposes the iOS-specific Critical Alerts
// authorization status (and other notification setting details) to JS.
// Capacitor's built-in LocalNotifications plugin only returns `display`,
// which does not tell us whether the Critical Alerts entitlement was
// actually granted by the user, so we add this thin bridge.
@objc(CriticalAlertsPlugin)
public class CriticalAlertsPlugin: CAPPlugin {

    @objc func checkStatus(_ call: CAPPluginCall) {
        UNUserNotificationCenter.current().getNotificationSettings { settings in
            let result: [String: Any] = [
                "authorization": Self.authString(settings.authorizationStatus),
                "critical": Self.settingString(settings.criticalAlertSetting),
                "alert": Self.settingString(settings.alertSetting),
                "sound": Self.settingString(settings.soundSetting),
                "lockScreen": Self.settingString(settings.lockScreenSetting),
                "notificationCenter": Self.settingString(settings.notificationCenterSetting)
            ]
            call.resolve(result)
        }
    }

    @objc func requestCritical(_ call: CAPPluginCall) {
        let center = UNUserNotificationCenter.current()
        let options: UNAuthorizationOptions = [.alert, .badge, .sound, .criticalAlert]
        center.requestAuthorization(options: options) { granted, error in
            if let error = error {
                call.reject(error.localizedDescription)
                return
            }
            // Re-read settings so we can report the actual critical state.
            center.getNotificationSettings { settings in
                let result: [String: Any] = [
                    "granted": granted,
                    "authorization": Self.authString(settings.authorizationStatus),
                    "critical": Self.settingString(settings.criticalAlertSetting)
                ]
                call.resolve(result)
            }
        }
    }

    /// Opens the iOS Settings app on this app's notification settings page
    /// (or the app settings page on older iOS versions). This is the only
    /// way to flip Critical Alerts back on once the user has denied them.
    @objc func openSettings(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            // Prefer the dedicated notification settings deep link when available
            let urlString: String
            if #available(iOS 16.0, *) {
                urlString = UIApplication.openNotificationSettingsURLString
            } else if #available(iOS 15.4, *) {
                urlString = UIApplicationOpenNotificationSettingsURLString
            } else {
                urlString = UIApplication.openSettingsURLString
            }

            guard let url = URL(string: urlString) else {
                call.reject("Could not build settings URL")
                return
            }

            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url, options: [:]) { success in
                    if success {
                        call.resolve(["opened": true])
                    } else {
                        // Fall back to generic app settings if the deep link refuses
                        if let fallback = URL(string: UIApplication.openSettingsURLString) {
                            UIApplication.shared.open(fallback, options: [:]) { ok in
                                call.resolve(["opened": ok, "fallback": true])
                            }
                        } else {
                            call.resolve(["opened": false])
                        }
                    }
                }
            } else if let fallback = URL(string: UIApplication.openSettingsURLString) {
                UIApplication.shared.open(fallback, options: [:]) { ok in
                    call.resolve(["opened": ok, "fallback": true])
                }
            } else {
                call.resolve(["opened": false])
            }
        }
    }

    private static func authString(_ status: UNAuthorizationStatus) -> String {
        switch status {
        case .notDetermined: return "notDetermined"
        case .denied: return "denied"
        case .authorized: return "authorized"
        case .provisional: return "provisional"
        case .ephemeral: return "ephemeral"
        @unknown default: return "unknown"
        }
    }

    private static func settingString(_ setting: UNNotificationSetting) -> String {
        switch setting {
        case .notSupported: return "notSupported"
        case .disabled: return "disabled"
        case .enabled: return "enabled"
        @unknown default: return "unknown"
        }
    }
}

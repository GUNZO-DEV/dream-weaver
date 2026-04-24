import Foundation
import Capacitor

// Registers the CriticalAlertsPlugin with Capacitor so it can be invoked
// from JavaScript via `registerPlugin('CriticalAlerts')`.
@objc(CriticalAlertsPluginRegistration)
public class CriticalAlertsPluginRegistration: NSObject {
    @objc public static let plugin = CAPPluginRegistration(
        pluginClassName: "CriticalAlertsPlugin",
        jsName: "CriticalAlerts",
        pluginMethods: [
            CAPPluginMethod(name: "checkStatus", returnType: CAPPluginReturnPromise),
            CAPPluginMethod(name: "requestCritical", returnType: CAPPluginReturnPromise)
        ]
    )
}

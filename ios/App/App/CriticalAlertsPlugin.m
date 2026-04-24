#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

// Registers the Swift plugin with the Capacitor bridge.
CAP_PLUGIN(CriticalAlertsPlugin, "CriticalAlerts",
  CAP_PLUGIN_METHOD(checkStatus, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(requestCritical, CAPPluginReturnPromise);
)

 # Native Alarm Sound Setup for iOS/Android
 
 ## The Problem
 iOS and Android require alarm sounds to be bundled as **native assets**, not web files.
 Web Audio API cannot play when the app is in the background or when a notification fires.
 
 ## Solution: Add Native Sound Files
 
 After running `npx cap sync`, you need to manually add the alarm sound file to the native projects:
 
 ### For iOS:
 1. Open the iOS project: `npx cap open ios`
 2. In Xcode, right-click on `App/App` folder
 3. Select "Add Files to App..."
 4. Add the sound file `public/alarm_sound.wav`
 5. Make sure "Copy items if needed" is checked
 6. Build and run
 
 ### For Android:
 1. Copy the sound file to: `android/app/src/main/res/raw/alarm_sound.wav`
 2. Create the `raw` folder if it doesn't exist
 3. Build and run
 
## iOS Critical Alerts Setup (REQUIRED)

Critical Alerts bypass **Do Not Disturb**, **Silent Mode**, and **Focus modes**. The code is already configured to use `interruptionLevel: 'critical'`. You must enable the capability in Xcode:

1. Open your iOS project: `npx cap open ios`
2. Select the **App** target → **Signing & Capabilities** tab
3. Click **+ Capability** → search for **"Critical Alerts"**
4. Add it (requires an Apple Developer account with Critical Alerts entitlement approved)
5. To request this entitlement from Apple, go to https://developer.apple.com/contact/request/notifications-critical-alerts-entitlement/
6. In your `App.entitlements` file, ensure this key exists:
   ```xml
   <key>com.apple.developer.usernotifications.critical-alerts</key>
   <true/>
   ```
7. The app will prompt users with a separate permission dialog for Critical Alerts at runtime
 
 ## Testing
 
 1. Build the app: `npm run build`
 2. Sync Capacitor: `npx cap sync`
 3. Run on device: `npx cap run ios` or `npx cap run android`
 4. Set an alarm and wait for it to fire, or use the "Test Alarm Sound" button
 
 ## Troubleshooting
 
 - **No sound**: Make sure the sound file is in the correct native folder
 - **Notification disappears quickly**: iOS limitation; enable Critical Alerts for persistent notifications
 - **Sound file not found**: Check the file name matches exactly (case-sensitive)
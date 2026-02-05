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
 
 ## iOS Notification Persistence
 
 iOS notifications are transient by default. To make alarm notifications persist:
 
 1. **Time Sensitive Notifications**: Already configured in the code
 2. **Critical Alerts**: Requires Apple approval. Add to your app's entitlements if needed:
    - Open Xcode > App target > Signing & Capabilities
    - Add "Critical Alerts" capability (requires Apple Developer account approval)
 
 ## Testing
 
 1. Build the app: `npm run build`
 2. Sync Capacitor: `npx cap sync`
 3. Run on device: `npx cap run ios` or `npx cap run android`
 4. Set an alarm and wait for it to fire, or use the "Test Alarm Sound" button
 
 ## Troubleshooting
 
 - **No sound**: Make sure the sound file is in the correct native folder
 - **Notification disappears quickly**: iOS limitation; enable Critical Alerts for persistent notifications
 - **Sound file not found**: Check the file name matches exactly (case-sensitive)
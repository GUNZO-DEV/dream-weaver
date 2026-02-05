

# Fix Authentication for Standalone iOS App

## Problem Summary
Your app shows a "Login to Lovable" prompt in Xcode because:
1. **Session storage fails on iOS** - `localStorage` doesn't persist reliably in Capacitor's WKWebView
2. **Google OAuth won't work natively** - Web redirects can't return to a native app bundle
3. **Lovable Cloud auth library** - Only works in the Lovable preview environment, not in standalone builds

## Solution Overview
We need to make authentication work independently in the native iOS app by:
1. Using Capacitor Preferences plugin for persistent session storage
2. Switching to email/password authentication (which works natively)
3. Configuring the Supabase client for native platform detection

---

## Implementation Steps

### Step 1: Install Capacitor Preferences Plugin
Add the `@capacitor/preferences` package which provides persistent key-value storage that works reliably on iOS using native storage mechanisms (iOS Keychain-backed).

### Step 2: Create a Custom Storage Adapter
Create a storage adapter that:
- Detects if the app is running natively (using `Capacitor.isNativePlatform()`)
- Uses Capacitor Preferences API on iOS/Android
- Falls back to localStorage on web

```text
┌─────────────────────────────────────────────┐
│           App Starts                        │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Is Native Platform?                        │
│  (Capacitor.isNativePlatform())             │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌───────────────┐   ┌───────────────┐
│ Use Capacitor │   │ Use Browser   │
│ Preferences   │   │ localStorage  │
│ (Persistent)  │   │ (Default)     │
└───────────────┘   └───────────────┘
```

### Step 3: Update Supabase Client Configuration
Modify the client initialization to:
- Use the custom storage adapter
- Set `detectSessionInUrl: false` for native builds (no URL redirects)
- Enable proper session persistence

### Step 4: Update Auth Context for Native
- Add platform detection
- Ensure session restoration works on app launch
- Handle the async nature of Capacitor Preferences

### Step 5: Update Auth Page for Native Compatibility
- Keep email/password authentication (works on native)
- Conditionally hide Google OAuth button on native platforms (it won't work without additional native SDK integration)
- Add clear messaging for native users

---

## Technical Details

### New File: `src/lib/capacitorStorage.ts`
A custom storage class implementing the Supabase `SupportedStorage` interface that wraps Capacitor Preferences for native and falls back to localStorage for web.

### Modified Files:
1. **`src/integrations/supabase/client.ts`** - Use custom storage adapter
2. **`src/contexts/AuthContext.tsx`** - Handle async storage initialization
3. **`src/pages/Auth.tsx`** - Hide Google OAuth on native, improve native UX
4. **`package.json`** - Add `@capacitor/preferences` dependency

---

## What This Fixes
- Sessions persist across app closes on iOS
- Email/password login works in standalone builds
- No more "Login to Lovable" prompts
- App works completely offline after initial login

## Post-Implementation Steps
After I make these changes, you'll need to:
1. Pull the updated code from GitHub
2. Run `npm install` to get the new Preferences plugin
3. Run `npx cap sync` to sync the native plugins
4. Rebuild and run in Xcode


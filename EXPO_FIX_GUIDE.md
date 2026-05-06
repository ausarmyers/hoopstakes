# Expo Go Remote Update Cache Fix - Complete Guide

## Problem
Expo Go on Android caches EAS Update configuration by app slug. Once `"slug": "hoopstakes"` is registered with EAS, Expo Go tries to fetch remote updates even when `"updates": { "enabled": false }` is set in `app.json`. This results in:
```
Uncaught Error: java.io.IOException: Failed to download remote update
```

The error occurs at app startup, before JavaScript loads, making it impossible to bypass via code.

---

## Solution Options

### ✅ OPTION A: Change Slug (Quick Fix - CURRENTLY IMPLEMENTED)

**Status:** ✅ Already applied to your project

**What was changed:**
```json
// app.json
{
  "expo": {
    "name": "HoopStakes Dev",
    "slug": "hoopstakes-dev"  // ← Changed from "hoopstakes"
    "updates": {
      "enabled": false
    }
  }
}
```

**Why this works:**
- `hoopstakes-dev` is a fresh slug with no EAS history
- Expo Go treats it as a new app with no cached configuration
- No remote update check is triggered for an unregistered slug

**Steps to complete:**

1. **On Android device, clear Expo Go cache:**
   ```bash
   Settings → Apps → Expo Go → Storage → Clear Storage
   # (NOT just "Clear Cache" - must clear all storage)
   ```

2. **On macOS, restart Expo with new slug:**
   ```bash
   # If Expo is running, stop it (you may have done this)
   # New slug is already set in app.json
   npx expo start
   ```

3. **Scan new QR code:**
   - Open Expo Go
   - Scan the QR code displayed in terminal
   - App should load **without** the remote update error

**Expected result:** App loads with full styling (colors, borders, spacing visible)

**Pros:**
- ✅ Instant fix
- ✅ No dependencies changed
- ✅ No code rewrites
- ✅ Works immediately

**Cons:**
- ❌ Temporary (for development only)
- ❌ Different slug for dev vs production
- ❌ Need to change back before publishing

---

### ⚡ OPTION B: Development Build (Recommended for Serious Development)

**Status:** More robust, skip if Option A works

A "development build" is a custom Expo Go built specifically for YOUR project. It bypasses the Expo Go client-side cache issue entirely.

#### Prerequisite Setup (One-time)

1. **Install EAS CLI:**
   ```bash
   npm install -g eas-cli
   ```

2. **Authenticate with Expo:**
   ```bash
   eas login
   # Creates account on expo.dev if needed
   ```

3. **Configure project for EAS:**
   ```bash
   eas build:configure
   # Follow the prompts (keep defaults, use "hoopstakes" as project name)
   ```

#### Build Development APK (Android)

```bash
# Build a development APK
eas build --platform android --profile preview

# After ~5-10 minutes, you get an APK download link
# Download and install on device:
adb install <downloaded-apk-name>.apk
```

#### Develop with Development Build

Once installed on your device, instead of scanning QR in Expo Go:

```bash
# Terminal: Start Expo in development mode
npx expo start --dev-client

# On device:
# 1. Open the installed app (not Expo Go)
# 2. Shake device or press menu button
# 3. Select "Connect to development server"
# 4. Scan QR code from terminal

# Now your app loads WITHOUT Expo Go's cache layer
```

**Pros:**
- ✅ No cache issues (custom build, no shared Expo Go cache)
- ✅ Faster reload times
- ✅ Better development experience
- ✅ Same build you can distribute to testers
- ✅ Production-ready when you release

**Cons:**
- ❌ Requires ~5-10 min to build first time
- ❌ Need Expo account (free)
- ❌ ~100MB APK download

---

## Recommended Path

### For Immediate Testing (Right Now)
**Use Option A (slug change)** - Already applied

```bash
# Device: Clear storage
Settings → Apps → Expo Go → Storage → Clear Storage

# Terminal: Confirm Expo is running
npx expo start

# Device: Rescan QR code
```

### For Serious Development
**Use Option B (Development Build)** - After confirming Option A works

```bash
# One-time setup
npm install -g eas-cli
eas login
eas build:configure

# Build dev APK
eas build --platform android --profile preview

# Install on device, then develop with:
npx expo start --dev-client
```

---

## Full Command Reference

### Option A - Testing Now
```bash
# Stop current Expo if running
killall -9 node 2>/dev/null || true

# Start fresh with new slug
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
npx expo start

# Watch for QR code in terminal
# Device: Settings > Apps > Expo Go > Storage > Clear Storage
# Device: Scan QR code
```

### Option B - Development Build Setup
```bash
# Global install
npm install -g eas-cli

# Authenticate (one-time)
eas login

# Configure project (one-time)
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
eas build:configure

# Build custom APK (takes 5-10 min)
eas build --platform android --profile preview

# Download APK from link provided, then:
adb install path/to/downloaded.apk

# Develop with custom build
npx expo start --dev-client
```

---

## Troubleshooting

### "Still getting update error with new slug"
**Cause:** Expo Go cache not fully cleared

**Fix:**
```bash
# On device, more thorough clear:
Settings → Apps → Expo Go → Storage → Delete app data
Settings → Apps → Expo Go → Storage → Clear cache
# Then uninstall & reinstall Expo Go from Play Store
# THEN rescan QR code
```

### "QR code doesn't load in Expo Go"
**Cause:** Device and Mac not on same network (if using LAN mode)

**Fix:**
```bash
# Start with tunnel (slower but works anywhere)
npx expo start --tunnel

# Or ensure device/Mac on same WiFi
```

### "Got past update error but app crashes"
**Cause:** Likely unrelated to this fix

**Check:**
```bash
# Terminal: Watch for error messages in Expo output
# Device: Error should show in dev menu

# If styling issues:
# All gradients should be removed (already done in your code)
# Check TypeScript: npx tsc --noEmit
```

---

## What's Already Been Fixed in Your Code

✅ **Styling issues (solved):**
- Removed all NativeWind-incompatible gradient classes
- Replaced `bg-gradient-to-*`, `from-*`, `to-*` with solid colors
- Created helper functions for dynamic tier colors
- Fixed opacity modifiers (`/20` → solid colors)

✅ **Dependencies (cleaned):**
- Removed broken `expo-linear-gradient` reference

✅ **Config (updated):**
- Set `"updates": { "enabled": false }`
- Changed slug to `hoopstakes-dev` (bypasses EAS cache)

---

## Current Status

| Component | Status |
|-----------|--------|
| Code Quality | ✅ TypeScript: 0 errors |
| Bundler | ✅ Compiles successfully |
| Styling | ✅ All NativeWind compatible |
| Dependencies | ✅ Clean |
| Expo Server | ✅ Running with new slug |
| Device Loading | ⏳ Awaiting Expo Go cache clear + QR rescan |

---

## Next Steps

### Immediate (Do This Now)
1. On Android device: Clear Expo Go storage completely
2. In Expo Go: Scan the new QR code (for `hoopstakes-dev`)
3. App should load without update error ✨

### If Still Failing
1. Try Option B (Development Build)
2. Or share terminal output for additional debugging

### Before Production
1. Change slug back to `"hoopstakes"` 
2. Set `"updates": { "enabled": true }` if using EAS Updates
3. Build with `eas build --platform android` for production APK

# HoopStakes Development Build Setup - Complete Step-by-Step Guide

**Goal:** Create a custom Android app that replaces Expo Go, loads local code instantly, and never checks for remote updates.

**Estimated Time:** 20-30 minutes (first time setup)

---

## PART 1: Install Expo Dev Client

### Step 1.1: Add Dev Client Package

Run this command in your project directory:

```bash
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
npm install expo-dev-client
```

**What this does:** Installs the Expo dev client library (200KB)

**Expected output:**
```
added 1 package, removed 0 packages, and audited 848 packages in 2m 45s
```

### Step 1.2: Verify Installation

Check that it was added to `package.json`:

```bash
grep "expo-dev-client" package.json
```

**Expected output:**
```
"expo-dev-client": "^x.x.x"
```

If you don't see it, the installation failed. Run the install command again.

---

## PART 2: Update app.json Configuration

### Step 2.1: Add Dev Client Plugin

Open `app.json` and locate the `plugins` array. Currently it looks like this:

```json
"plugins": [
  "expo-router",
  "expo-font",
  [
    "expo-location",
    { ... }
  ],
  [
    "expo-barcode-scanner",
    { ... }
  ]
]
```

**Add this line** at the top of the plugins array:

```json
"plugins": [
  "expo-dev-client",
  "expo-router",
  "expo-font",
  [
    "expo-location",
    { ... }
  ],
  [
    "expo-barcode-scanner",
    { ... }
  ]
]
```

### Step 2.2: Verify Updates Config

Make sure your `app.json` has this (should already be there):

```json
"updates": {
  "enabled": false
}
```

### Step 2.3: Full app.json Plugins Section (Reference)

Your complete `plugins` section should now look like:

```json
{
  "expo": {
    "name": "HoopStakes Dev",
    "slug": "hoopstakes-dev",
    "version": "1.0.0",
    "scheme": "hoopstakes",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "platforms": ["ios", "android"],
    "updates": {
      "enabled": false
    },
    "plugins": [
      "expo-dev-client",
      "expo-router",
      "expo-font",
      [
        "expo-location",
        {
          "locationWhenInUsePermission": "HoopStakes needs your location to find nearby gyms."
        }
      ],
      [
        "expo-barcode-scanner",
        {
          "cameraPermission": "HoopStakes needs camera access to scan gym QR codes."
        }
      ]
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.hoopstakes.app"
    },
    "android": {
      "package": "com.hoopstakes.app"
    }
  }
}
```

### Step 2.4: Save and Verify

Save the file. Run this to check for JSON errors:

```bash
npx tsc --noEmit
```

**Expected:** No output = no errors ✅

---

## PART 3: Prepare Android Device

### Step 3.1: Enable Developer Options

**On your Android phone:**

1. Go to **Settings → About Phone**
2. Scroll down to **Build Number**
3. **Tap Build Number 7 times** (yes, exactly 7)
4. You'll see a toast message: "You are now a developer!"
5. Go back to **Settings**
6. You should now see **Developer Options** near the bottom

### Step 3.2: Enable USB Debugging

**In Developer Options:**

1. Scroll down and find **USB Debugging**
2. **Toggle it ON** (it should be blue/enabled)
3. A dialog may appear asking to allow USB debugging — **Tap OK**

### Step 3.3: Connect Phone to Mac via USB

1. Plug your Android phone into your Mac with a USB cable
2. On your phone, a dialog may appear: "Allow USB debugging?" — **Tap Allow**
3. Your Mac and phone are now connected

### Step 3.4: Verify Device Detection

On Mac, run:

```bash
adb devices
```

**Expected output:**
```
List of attached devices
emulator-5554          device
```

Or if you have a physical phone:
```
List of attached devices
FA86K1A2345           device
```

**If you see "device" (not "offline" or "unauthorized")**, your device is ready ✅

### Step 3.5: Troubleshooting Device Not Detected

**Problem:** `adb: command not found`

**Solution:**
```bash
# Install Android SDK tools (if you don't have adb)
brew install android-platform-tools

# Then try again:
adb devices
```

**Problem:** Device shows "unauthorized"

**Solution:**
1. Unplug phone
2. On phone: Go to **Settings > Developer Options > Revoke USB Debugging Authorizations**
3. Plug back in
4. Tap **Allow** on the dialog
5. Run `adb devices` again

**Problem:** Device not appearing at all

**Solution:**
1. Try a different USB cable (some cables are charging-only)
2. Restart phone
3. Restart Mac
4. Check if Developer Options are still enabled

---

## PART 4: Build & Install Custom Android App

### Step 4.1: Clean Previous Builds (Important!)

```bash
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
rm -rf .expo
npx expo prebuild --clean
```

**What this does:** Removes old build artifacts that might cause conflicts

### Step 4.2: Build and Install on Device

Run this command:

```bash
npx expo run:android
```

**What happens:**
1. Metro bundler starts (compiling your React code)
2. Android build system (Gradle) is triggered
3. A custom APK is built specifically for your app
4. The APK is automatically installed on your phone
5. The app opens automatically

**Expected output timeline:**
```
▄▄▄▄▄▄▄▄▄ Metro Bundler Started ▄▄▄▄▄▄▄▄▄
Starting Metro Bundler

Building Gradle app...
...
[lots of gradle output]
...
✓ Built app.apk (15.2 MB)

Installing on device...
✓ Installed successfully

Starting app on device...
```

**Time estimate:** 3-5 minutes first time (subsequent builds are 30 seconds)

### Step 4.3: Device Selection

If you have multiple devices/emulators connected, you'll see:

```
Which device would you like to run the app on?
1. emulator-5554 (Virtual)
2. FA86K1A2345 (Physical)
? 
```

**Select your physical phone** (usually option 2)

### Step 4.4: App Launches

After "Installing on device", your app should:
1. Appear on your home screen as "HoopStakes Dev"
2. Open automatically
3. Show your app's home screen with full styling (colors, borders, spacing)

**✅ Success!** You now have a custom development app instead of using Expo Go.

---

## PART 5: Develop with Your Custom Build

### Step 5.1: Start Metro Bundler (Without Device Build)

Now that the app is installed, you don't need to rebuild every time. Just start the bundler:

```bash
npx expo start --dev-client
```

**What you'll see:**
```
▄▄▄▄▄▄▄▄▄ Metro Bundler Started ▄▄▄▄▄▄▄▄▄
Starting Metro Bundler

[Press j to open debugger in your browser]
[Press m to toggle menu]
[Press r to reload]
[Press ? for help]

Waiting for a connection...
```

### Step 5.2: Connect Device to Bundler

On your Android phone:
1. Open the **HoopStakes Dev** app
2. **Shake the phone** (or press volume-up + power, or hit menu button)
3. A menu appears: "Reload", "Connect to dev server", etc.
4. Tap **"Connect to dev server"**
5. Enter your Mac's IP address:
   - Run `ipconfig getifaddr en0` on Mac to get your IP
   - Or just scan the QR code shown in terminal

**Expected:** App reloads and connects to your Mac

### Step 5.3: Hot Reload (The Magic Part)

Now every time you **save a file**, the app automatically reloads:

1. Edit a file (e.g., `app/(tabs)/home.tsx`)
2. Save (Cmd+S)
3. App reloads instantly on device (2-3 seconds)
4. See your changes live

### Step 5.4: Manual Reload

If auto-reload doesn't work:
- **Shake phone** → select "Reload"
- Or press `r` in the terminal where Metro is running

### Step 5.5: Debug Menu

**Shake phone** or press menu to see:
```
▶ Reload
▶ Connect to dev server
▶ Remote debugger URL
▶ Go home
▶ Disable Fast Refresh
```

**Use these to debug:**
- **Reload:** Hard refresh if app is stuck
- **Go home:** Exit to home screen
- **Remote debugger:** Open Chrome DevTools

---

## PART 6: Troubleshooting

### Problem: "adb: command not found"

**Cause:** Android SDK tools not installed

**Fix:**
```bash
brew install android-platform-tools
adb devices  # Verify it works
```

### Problem: "BUILD FAILED" during `npx expo run:android`

**Cause:** Usually gradle cache corruption or missing SDK

**Fix:**
```bash
# Full clean rebuild
rm -rf .expo
rm -rf android
npx expo run:android --clean
```

**If still failing:**
```bash
# Install Android SDK (if not already)
brew install android-sdk

# Then try again
npx expo run:android
```

### Problem: "Device offline" or "unauthorized"

**Cause:** USB connection issue

**Fix:**
1. Unplug phone
2. Wait 5 seconds
3. Plug back in
4. On phone, check for "Allow USB Debugging?" dialog → tap Allow
5. Run `adb devices` to verify

### Problem: App builds successfully but crashes on startup

**Cause:** Likely a code error (not dev client issue)

**Check terminal output:**
```bash
# Kill current process
Ctrl+C

# Restart and watch for errors
npx expo start --dev-client
# Look for red error messages
```

**Check device console:**
1. Open your app
2. Shake phone
3. Tap "Remote debugger URL"
4. Open in browser
5. Check console for errors

### Problem: Camera/Location permission denied

**Cause:** Android requires runtime permission requests

**The fix:** Your code should already handle this (check `find-game.tsx` and `gym-map.tsx`)

**If still failing:**
1. Go to **Settings → Apps → HoopStakes Dev → Permissions**
2. Enable **Camera** and **Location**
3. Restart the app

### Problem: Can't find "Connect to dev server" in menu

**Cause:** App not connected to dev bundler properly

**Fix:**
1. Make sure Mac and phone are on **same WiFi network**
2. In terminal, make sure Metro is running: `npx expo start --dev-client`
3. Look for QR code in terminal
4. On phone: Shake → "Connect to dev server" → scan QR code

### Problem: Metro bundler won't start

**Cause:** Port 8081 already in use

**Fix:**
```bash
# Kill process using port 8081
lsof -i :8081 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Try again
npx expo start --dev-client
```

### Problem: Can't install app — "INSTALL_FAILED_..."

**Cause:** Previous app version conflicting

**Fix:**
```bash
# Uninstall old app from device
adb uninstall com.hoopstakes.app

# Then rebuild
npx expo run:android
```

---

## PART 7: Daily Development Workflow

### Fresh Start (First Time Each Day)

```bash
# Terminal 1: Build and install on device
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
npx expo run:android

# Wait for app to open...
```

### Every Other Time

```bash
# Terminal: Just start bundler (no rebuild needed)
npx expo start --dev-client

# On phone: Shake → "Connect to dev server" → scan QR
```

### Common Workflow

```bash
# Terminal
npx expo start --dev-client

# Phone opens, shakes, connects

# Edit a file
# Save (Cmd+S)
# App reloads automatically in 2-3 seconds
# See changes live

# Edit another file
# Save
# App reloads again

# Repeat...
```

---

## PART 8: Ready for Distribution

Once development is complete, build a release APK:

### Change Slug Back to Production

Edit `app.json`:

```json
{
  "expo": {
    "name": "HoopStakes",        // Change from "HoopStakes Dev"
    "slug": "hoopstakes",         // Change from "hoopstakes-dev"
    "updates": {
      "enabled": true            // Enable updates for production
    }
  }
}
```

### Build Release APK

```bash
npx expo run:android --release
# Or for Google Play Store:
npx expo prebuild --clean
eas build --platform android --release
```

This creates a signed APK ready for Google Play Store.

---

## PART 9: Key Differences - Dev Build vs Expo Go

| Feature | Expo Go | Dev Build |
|---------|---------|-----------|
| **Remote update check** | ❌ Yes (crashes) | ✅ No |
| **Custom plugins** | Limited | ✅ Full support |
| **Auto-reload** | ✅ Works | ✅ Works |
| **Camera/Location** | ⚠️ Sometimes works | ✅ Always works |
| **Performance** | Slower | ✅ Faster |
| **Distribution** | N/A | ✅ Can share APK |
| **Size** | ~100MB (app) | ~50MB (APK) |

---

## Summary: What You Just Did

✅ Installed `expo-dev-client` package  
✅ Updated `app.json` to include dev client plugin  
✅ Enabled USB Debugging on Android  
✅ Built custom Android APK with `npx expo run:android`  
✅ App installed and runs without Expo Go  
✅ Metro bundler connects and hot-reloads code  
✅ No more "Failed to download remote update" errors  

**You now have a professional development setup!**

---

## Next: Start Development

```bash
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
npx expo start --dev-client
# Shake phone → Connect → Scan QR → Start coding!
```

---

## Quick Reference: Common Commands

```bash
# Build and install on device (first time)
npx expo run:android

# Start bundler only (after first build)
npx expo start --dev-client

# Verify device connected
adb devices

# Check your Mac's IP for connection
ipconfig getifaddr en0

# Kill Metro if stuck
Ctrl+C

# Full clean rebuild if something breaks
rm -rf .expo android
npx expo run:android --clean
```

---

## Still Having Issues?

### Check these first:
1. Device shows in `adb devices` (not offline/unauthorized)
2. `app.json` has `"expo-dev-client"` in plugins
3. `package.json` has `"expo-dev-client"` dependency
4. Phone is on same WiFi as Mac
5. USB cable is plugged in firmly

### Then share:
- Output of `adb devices`
- Error message from terminal or device
- Your current `app.json`
- Output of `npm list expo-dev-client`

# Local Dev Build Setup for HoopStakes — Exact Commands & Patch

## Part 1: Update app.json with expo-dev-client

### The Exact Patch

Replace the plugins array in your `app.json` with this (keeps all existing plugins intact):

**BEFORE:**
```json
"plugins": [
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
```

**AFTER:**
```json
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
```

**What changed:** Added `"expo-dev-client",` as the first item in the plugins array (order doesn't matter, but putting it first is conventional).

**Full updated app.json (minimal diff):**
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

---

## Part 2: Terminal Commands (Execute in Order)

### Step 1: Install expo-dev-client into your project
```bash
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
npx expo install expo-dev-client
```

**Expected output:** Should say "Added expo-dev-client@..." or "Already installed".

**Verify:**
```bash
npm ls expo-dev-client --depth=0
```
Should show version number (e.g., `expo-dev-client@0.20.0`).

---

### Step 2: Verify Android SDK is installed (macOS)

Check if you have Android SDK set up:
```bash
which adb
```

If you get a path like `/Users/username/Library/Android/sdk/platform-tools/adb`, you're good. If not, install it:
```bash
# Install Android platform-tools (macOS)
brew install --cask android-platform-tools
```

Verify adb now works:
```bash
adb version
```

---

### Step 3: Verify your Android device is recognized
Plug in your Android device (USB cable) and run:
```bash
adb devices
```

**Expected output:**
```
List of attached devices
ABC123DEF456     device
```

If you see "unauthorized" instead of "device", go to your phone and tap "Allow" on the USB debugging prompt.

If device doesn't appear:
- Try a different USB cable
- Change USB mode on phone: Settings → Developer options → Select USB Configuration → File Transfer (MTP)
- Unplug and replug

---

### Step 4: Update your app.json with expo-dev-client plugin

Edit `/Users/ausarmyers/Desktop/Comp 110/Hoopstakes/app.json`:
- Add `"expo-dev-client",` as the first line in the `"plugins"` array (see Part 1 above)
- Keep all other plugins and `"updates": { "enabled": false }` exactly as they are

---

### Step 5: Build and install the dev client APK on your device

This is the main command — it will:
1. Prebuild (generates native Android project in `android/` folder)
2. Run Gradle compile
3. Install APK on your connected device

```bash
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
npx expo run:android
```

**What to expect:**
- First run takes **5–15 minutes** (Gradle downloads dependencies)
- You'll see lots of output; this is normal
- Terminal will say something like "App opened on <device name>"
- The dev client app is now installed on your phone (do NOT open it yet)

**Possible prompts:**
- "Select a device" → Choose your Android phone (number 1, usually)

**If it fails:**
- See troubleshooting section below

---

### Step 6: Start Metro in dev-client mode

Once the APK is installed, start Metro (the bundler):
```bash
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
npx expo start --dev-client
```

**Expected output:**
```
Starting Metro bundler
...
[Terminal displays QR code]
...
```

**Keep this terminal open.**

---

### Step 7: Connect your device to Metro

On your Android phone:
1. Open the **HoopStakes Dev** app (the new dev client that was just installed — NOT Expo Go)
2. The app will show a "Metro Bundler" connection screen
3. If it doesn't auto-connect, tap **Scan QR code** and scan the code from your terminal
4. Wait ~10–20 seconds for your app to bundle and load

**Expected result:**
- App loads with full styling (colors, rounded corners, spacing visible)
- No "Failed to download remote update" error
- You can interact with the app

---

## Part 3: Day-to-Day Development

### Fast Refresh (Auto-reload on save)
```bash
# Keep Metro running in terminal (from Step 6)
npx expo start --dev-client

# In your IDE: Edit app/tabs/home.tsx (or any file) and save
# App reloads automatically on device
```

### Manual Reload
On device: Shake phone → tap "Reload"

### Clear bundler cache (if things get weird)
```bash
npx expo start --dev-client -c
```

### Debug JavaScript
On device: Shake → "Debug" → Opens Chrome dev tools in browser

### View native logs
```bash
adb logcat *:S ReactNative:V ReactNativeJS:V
```

---

## Troubleshooting

### "command not found: adb" (macOS)
**Fix:**
```bash
brew install --cask android-platform-tools
adb version
```

### "No devices found" / "unauthorized"
**Fix:**
- Replug USB cable
- Go to phone: Settings → Developer options → USB Configuration → File Transfer (MTP)
- On phone, confirm "Allow USB debugging"
- Run adb devices again

### "BUILD FAILED" during npx expo run:android

**Common cause:** Gradle/SDK issue. Try this:
```bash
# Navigate to project android folder
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes/android

# Run Gradle sync
./gradlew clean

# Go back to project root
cd ..

# Try build again
npx expo run:android
```

If that fails, you likely need to install Android SDK components via Android Studio:
```bash
# Install Android Studio (macOS)
brew install --cask android-studio

# Open it and let it download SDK components
open /Applications/Android\ Studio.app
```

After opening Android Studio, it will prompt to install missing SDK components. Let it finish (5–10 min), then try `npx expo run:android` again.

### "expo-dev-client plugin not found"
**Cause:** `npm install expo-dev-client` didn't run or didn't complete.

**Fix:**
```bash
npx expo install expo-dev-client
npm ls expo-dev-client --depth=0
# Verify it shows a version
```

### App opens but won't connect to Metro
**Fix:**
- Ensure Metro is running in terminal (Step 6)
- On device, shake → "Scan QR code"
- Scan the code from your terminal
- Wait 20 seconds

If Metro URL is not correct:
- Make sure device and Mac are on same WiFi (or use adb reverse):
```bash
adb reverse tcp:8081 tcp:8081
```

### "java.io.IOException: Failed to download remote update" still appears
**This should NOT happen with dev client.** If it does:
- Ensure you're opening the **HoopStakes Dev** app (dev client), not Expo Go
- Check that `app.json` has `"expo-dev-client"` in plugins
- Check that `"updates": { "enabled": false }` is set
- Restart: stop Metro, shake on device → "Reload"

### Camera / Location permissions not working
These are requested at runtime by your code. On device:
- Go to phone: Settings → Apps → HoopStakes Dev → Permissions
- Grant Camera, Location, etc. manually
- Reload app in dev client (shake → Reload)

---

## Command Summary (Copy & Paste)

```bash
# 1. Install dev client
cd /Users/ausarmyers/Desktop/Comp\ 110/Hoopstakes
npx expo install expo-dev-client

# 2. Verify adb
which adb
# If not found:
brew install --cask android-platform-tools

# 3. Verify device
adb devices

# 4. Update app.json (manually — add "expo-dev-client" to plugins array)

# 5. Build & install APK
npx expo run:android

# 6. Start Metro
npx expo start --dev-client

# 7. On device: Open HoopStakes Dev app, scan QR code or wait for auto-connect
```

---

## Final Checklist

- ✅ app.json has `"expo-dev-client"` in plugins array
- ✅ app.json has `"updates": { "enabled": false }`
- ✅ `npx expo install expo-dev-client` completed
- ✅ `adb devices` shows your Android phone
- ✅ `npx expo run:android` built and installed without errors
- ✅ `npx expo start --dev-client` is running in a terminal
- ✅ HoopStakes Dev app is open on phone and connected to Metro
- ✅ App loads with full styling (no update errors)

Once all checkmarks pass, you're fully set up for local development. Happy coding!

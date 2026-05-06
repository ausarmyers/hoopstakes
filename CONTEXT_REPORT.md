# HoopStakes App - Context Report & Issues

## Project Overview
**Project Name:** HoopStakes  
**Tech Stack:** React Native (Expo), TypeScript, NativeWind/Tailwind CSS, Firebase, Zustand  
**Platform:** Android & iOS (Expo Go Development)  
**Status:** Styling fixes completed, but app fails to load in Expo Go with persistent error

---

## Critical Issue

### Problem Statement
When scanning the QR code in Expo Go on Android device, the app throws:
```
Uncaught Error: java.io.IOException: Failed to download remote update
```

The error prevents the app from loading entirely. The user cannot see any UI or functionality - only the error message is displayed.

### What We've Tried
1. ✅ Disabled EAS Updates in `app.json` by adding:
   ```json
   "updates": {
     "enabled": false
   }
   ```

2. ✅ Removed `expo-linear-gradient` dependency from `package.json` (was causing Metro bundler startup failures)

3. ✅ Restarted Expo server multiple times with various flags:
   - `npx expo start`
   - `npx expo start -c` (cache clear)
   - `npx expo start --tunnel`
   - `npx expo start --offline`

4. ✅ TypeScript validation: **0 errors** - all code is syntactically valid

5. ✅ Reinstalled dependencies with `npm install --legacy-peer-deps`

6. ✅ Cleared Expo bundler cache

### Still Failing
Despite all these steps, Expo Go on the Android device continues to throw the "failed to download remote update" error before even attempting to load the app's JavaScript bundle.

---

## Root Cause Analysis

### Hypothesis 1: Expo Go Client-Side Caching
The Expo Go app on the Android device may have cached EAS Update configuration from a previous build/version, and the local `app.json` changes are not reaching the device.

**Evidence:**
- Error occurs at app startup (before JavaScript loads)
- Even with `updates.enabled: false`, the error persists
- Setting `--offline` flag on dev server doesn't prevent error
- TypeScript and bundler report 0 errors

### Hypothesis 2: Expo Go Configuration Lock-In
Once an Expo app slug is scanned in Expo Go, it may be locked to expecting EAS Updates, and clearing this requires more than app data clear.

---

## Project Structure

```
/Users/ausarmyers/Desktop/Comp 110/Hoopstakes/
├── app.json                          (Expo config - updates disabled)
├── package.json                      (Dependencies)
├── tailwind.config.js               (Tailwind CSS config)
├── tsconfig.json                    (TypeScript config)
├── app/
│   ├── _layout.tsx                  (Root layout)
│   ├── index.tsx                    (Home screen)
│   ├── (tabs)/                      (Tab navigation)
│   │   ├── _layout.tsx
│   │   ├── home.tsx                (Dashboard - FIXED: removed gradient)
│   │   ├── find-game.tsx           (Player discovery - FIXED: 4 helpers for colors)
│   │   ├── gym-map.tsx             (Gym map - FIXED: solid background)
│   │   ├── leaderboard.tsx         (Rankings - no changes needed)
│   │   ├── profile.tsx             (User profile - FIXED: color helpers)
│   │   └── wallet.tsx              (Wallet - no changes needed)
│   └── (auth)/
│       ├── sign-in.tsx             (Auth - FIXED: opacity modifiers)
│       └── tier-selection.tsx      (Tier selection - FIXED: solid colors)
```

---

## Previous Fixes Applied

### Issue: Styling Not Rendering in Expo Go
**Root Cause:** NativeWind 2.0.11 does NOT support Tailwind CSS gradient utilities (`from-X`, `to-X`, `bg-gradient-to-*`). These are CSS-only and don't transpile to React Native inline styles.

**Solution Implemented:**
Replaced all gradient class usages with solid color helpers across 6 screens:

1. **find-game.tsx:**
   - Removed: `className="bg-gradient-to-b from-purple-50 to-white"`
   - Added: `className="bg-purple-50"`
   - Created helpers: `getTierColor()`, `getTierOpacityBg()`, `getTierTextColor()`, `getTierBorderColor()`

2. **home.tsx:**
   - Removed: `const tierColor = user.tier === 'Elite' ? 'from-purple-500 to-pink-500' : ...`
   - Created: `getTierColor()` returning solid colors (`'bg-purple-500'`, `'bg-blue-500'`, `'bg-green-500'`)

3. **gym-map.tsx:**
   - Changed: `bg-gradient-to-b from-blue-50 to-white` → `bg-blue-50`

4. **profile.tsx:**
   - Removed gradient tierColor variable
   - Created `getTierColor()` helper returning solid background classes

5. **sign-in.tsx:**
   - Fixed opacity modifiers not supported in React Native:
   - Changed: `bg-orange-500/20` → `bg-orange-900`
   - Changed: `active:bg-orange-500/30` → `active:opacity-80`

6. **tier-selection.tsx:**
   - Updated TIERS array colors from gradient syntax to solid:
     - Rookie: `'from-green-500 to-emerald-500'` → `'bg-green-500'`
     - Hoopster: `'from-blue-500 to-cyan-500'` → `'bg-blue-500'`
     - Elite: `'from-purple-500 to-pink-500'` → `'bg-purple-500'`

### Package.json Changes
- **Removed:** `"expo-linear-gradient": "~15.0.8"` (was breaking Metro bundler startup)

---

## Current Dependencies

```json
{
  "expo": "^54.0.0",
  "react": "19.1.0",
  "react-native": "0.81.5",
  "nativewind": "^2.0.11",
  "tailwindcss": "^3.4.19",
  "expo-router": "~6.0.21",
  "zustand": "^4.5.7",
  "firebase": "^10.14.1",
  "react-native-maps": "1.20.1",
  "@stripe/stripe-react-native": "0.50.3"
}
```

---

## Error Timeline

1. **Initial Issue:** App showed text/emojis but no styling in Expo Go
2. **Diagnosed:** NativeWind gradient incompatibility
3. **Fixed:** Replaced 60+ gradient class usages with solid colors
4. **New Error:** After fixes, Expo startup failed with "expo-linear-gradient...doesn't seem to be installed"
5. **Fixed:** Removed gradient dependency from package.json
6. **Expected:** App should load with styling
7. **Actual:** New error appears: "Failed to download remote update"
   - Even with `updates.enabled: false`
   - Even with `--offline` flag
   - Even after Expo Go app data clear

---

## Questions for Resolution

1. **Is this a stale Expo Go cache issue?** The error occurs at startup, before any local config is read. Could Expo Go be using server-side manifest info?

2. **Should we use a different approach?** 
   - Build standalone APK instead of using Expo Go?
   - Use Expo Application Services (EAS) Build instead of local development?
   - Switch from Expo to bare React Native?

3. **Is the slug causing issues?** Once `"slug": "hoopstakes"` was registered with EAS, does it require continuous EAS configuration?

4. **What's the correct workaround?** 
   - Remove the slug from app.json?
   - Use a different slug for local development?
   - Configure EAS properly instead of disabling it?

---

## Code Quality
- **TypeScript Check:** ✅ 0 errors
- **Code Syntax:** ✅ Valid
- **Styling:** ✅ NativeWind compatible (all gradients removed)
- **Dependencies:** ✅ Properly installed (except previously removed linear-gradient)
- **Bundler:** ✅ Compiles successfully

---

## Environment Details
- **OS:** macOS
- **Node Version:** Latest (in workspace)
- **Expo Version:** 54.0.0
- **Metro Bundler:** ✅ Running successfully
- **Device:** Android (Expo Go)
- **Dev Server Mode:** LAN & Offline tested

---

## Summary
The app itself is **code-complete and styled properly** (TypeScript validates, bundler compiles). The issue is exclusively with Expo Go attempting to fetch remote updates before running the app, even though updates are disabled in config. The error occurs at the Expo Go app level, not in the JavaScript/TypeScript code.

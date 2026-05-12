Firebase iOS SPM Setup (HoopStakes)

This document shows exact steps to add Firebase via Swift Package Manager and verify the native initialization.

Prerequisites
- Xcode (>= 14)
- Open the workspace: `ios/HoopStakesDev.xcworkspace` (or project if applicable)
- Confirm `ios/HoopStakesDev/GoogleService-Info.plist` exists and `BUNDLE_ID` matches your target (`com.hoopstakes.app`).

Add Firebase SDK via SPM
1. In Xcode: File → Add Packages...
2. Enter URL: `https://github.com/firebase/firebase-ios-sdk`
3. Choose a version (Default: Latest). Click Next.
4. Select the product packages you need. Recommended for HoopStakes:
   - FirebaseAuth
   - FirebaseFirestore
   - FirebaseFunctions
   - FirebaseCrashlytics (optional)
   - FirebaseAnalytics (optional)
5. Click Add Package.

Link packages to your app target
1. Select your app target → General → Frameworks, Libraries, and Embedded Content.
2. Ensure the Firebase libraries you selected are present and set to "Embed & Sign" if required.

Native initialization
- `AppDelegate.swift` already includes a Firebase initializer call:

  import FirebaseCore
  ...
  if FirebaseApp.app() == nil {
    FirebaseApp.configure()
  }

This ensures the native SDK is configured before React/Expo starts.

Post-install checks
- Build (Cmd+B) and fix any missing linker issues.
- Run on device/simulator. Confirm logs show Firebase configured (or no errors).
- Verify `GoogleService-Info.plist` is part of your app target: select the plist in Xcode, open File Inspector, ensure the app target is checked.

Testing auth + Firestore from the app
- Launch the app, sign in with a test account.
- From Chrome devtools (React Native), call into your functions or Firestore operations you use (or exercise flows: check-in, report match, request cashout).

CI / Fastlane notes
- For CI builds, ensure the GoogleService-Info.plist is present in the repo or injected during the build.
- If using EAS, ensure ENV vars for Firebase web config are set for JS SDK.

If you want, I can also add a small Fastlane lane or CI snippet to ensure `GoogleService-Info.plist` is included in the build artifact.

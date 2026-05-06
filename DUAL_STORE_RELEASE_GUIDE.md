# Dual Store Release Guide (iOS + Android)

## Prerequisites

1. Install EAS CLI globally:

```bash
npm install -g eas-cli
```

2. Login:

```bash
eas login
```

3. Configure project once:

```bash
eas build:configure
```

## Required Environment Variables

Set these in EAS secrets or local env:

- `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## Build for Internal Testing

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

- iOS -> TestFlight internal testers
- Android -> Play Console Internal Testing

## Production Build

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

## Submit to Stores

```bash
eas submit --platform ios --profile production
eas submit --platform android --profile production
```

## Store Compliance Checklist

- Apple Sign In available when social auth is present
- Privacy policy URL and support URL configured in both stores
- Accurate permission disclosures for location/camera/mic
- No misleading cashout claims (must match in-app thresholds)
- Test cashout and subscription edge cases in production-like env

## Recommended Release Workflow

1. Promote backend (Functions + Firestore rules)
2. Push preview builds and validate with internal users
3. Verify Stripe checkout and webhook subscription updates
4. Verify dual-confirmation/dispute flow
5. Cut production build and submit to both stores

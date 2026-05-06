import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { Platform } from 'react-native';
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const;

const invalidKeys = requiredKeys.filter((key) => {
  const value = String(firebaseConfig[key] || '').trim();
  return !value || value.includes('your_') || value.includes('your-project');
});

if (invalidKeys.length > 0) {
  console.warn(
    `[firebase] Missing/placeholder config keys: ${invalidKeys.join(', ')}. ` +
      'Set EXPO_PUBLIC_FIREBASE_* values in your environment file.'
  );
}

// Reuse the default app during Fast Refresh to avoid duplicate init crashes.
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

export async function getFirebaseAnalytics() {
  if (Platform.OS !== 'web') return null;
  const supported = await isAnalyticsSupported();
  if (!supported) return null;
  return getAnalytics(app);
}
import { logEvent } from 'firebase/analytics';
import { getFirebaseAnalytics } from './firebase';
import { ingestAnalyticsEvent } from './backend';

type EventPayload = Record<string, string | number | boolean | null | undefined>;

export async function logAnalyticsEvent(eventName: string, payload: EventPayload) {
  try {
    const analytics = await getFirebaseAnalytics();
    if (analytics) {
      await logEvent(analytics, eventName, payload as Record<string, any>);
    }
  } catch (error) {
    console.warn('firebase analytics log failed', error);
  }

  try {
    await ingestAnalyticsEvent(eventName, payload);
  } catch (error) {
    console.warn('analytics ingestion failed', error);
  }
}

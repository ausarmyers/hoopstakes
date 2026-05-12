/**
 * useOfflineSync: Auto-sync offline queue when network returns
 * Monitor network state and process any pending actions
 */
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processQueue, getQueueStatus } from '../lib/offlineQueue';
import { submitMatchResult, openMatchDispute, requestCashout } from '../lib/backend';
import { auth } from '../lib/firebase';
import * as Haptic from 'expo-haptics';
import { logAnalyticsEvent } from '../lib/telemetry';

let syncInProgress = false;
let syncRequestedWhileRunning = false;

export const useOfflineSync = () => {
  useEffect(() => {
    let cancelled = false;

    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected && (state.isInternetReachable ?? true);

      if (isOnline) {
        console.log('[OfflineSync] Network restored, processing queue...');
        void requestSync();
      } else {
        console.log('[OfflineSync] Network offline');
      }
    });

    void NetInfo.fetch().then(state => {
      if (!cancelled && state.isConnected && (state.isInternetReachable ?? true)) {
        void requestSync();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);
};

/**
 * Process all queued actions (called on network restore)
 */
const requestSync = async () => {
  if (syncInProgress) {
    syncRequestedWhileRunning = true;
    console.log('[OfflineSync] Sync already in progress, deferring request');
    return;
  }

  syncInProgress = true;
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      if (__DEV__) {
        console.log('[OfflineSync] No authenticated user, skipping queue sync');
      }
      void logAnalyticsEvent('offline_queue_sync_skipped', { reason: 'no_authenticated_user' });
      return;
    }

    try {
      await currentUser.getIdToken(true);
      if (__DEV__) {
        console.log('[OfflineSync] Refreshed Firebase auth token before queue sync');
      }
      void logAnalyticsEvent('offline_queue_token_refreshed', { uid: currentUser.uid });
    } catch (tokenError) {
      if (__DEV__) {
        console.warn('[OfflineSync] Failed to refresh Firebase auth token, skipping sync', tokenError);
      }
      void logAnalyticsEvent('offline_queue_sync_skipped', { reason: 'token_refresh_failed' });
      return;
    }

    const initialStatus = await getQueueStatus();
    void logAnalyticsEvent('offline_queue_sync_started', { pending: initialStatus.pending });

    do {
      syncRequestedWhileRunning = false;

      const status = await getQueueStatus();

      if (status.pending === 0) {
        if (__DEV__) {
          console.log('[OfflineSync] Queue is empty, nothing to sync');
        }

        if (!syncRequestedWhileRunning) {
          return;
        }

        if (__DEV__) {
          console.log('[OfflineSync] Sync requested during active run, checking queue again...');
        }
        continue;
      }

if (__DEV__) {
          console.log(
            `[OfflineSync] Syncing ${status.pending} pending action(s):`,
            status.types.join(', ')
          );
        }

      const result = await processQueue(async action => {
        switch (action.type) {
          case 'submit_match': {
            const { opponentUid, myScore, oppScore, courtId, courtCity, courtHasAdmin, courtQrCode } = action.payload;
            await submitMatchResult({
              opponentUid,
              myScore,
              opponentScore: oppScore,
              courtId,
              courtCity,
              courtHasAdmin,
              courtQrCode,
            });
            break;
          }
          case 'report_dispute': {
            const { matchId, reason } = action.payload;
            await openMatchDispute(matchId, reason);
            break;
          }
          case 'request_cashout': {
            const { amount } = action.payload;
            await requestCashout(amount);
            break;
          }
          default:
            console.warn(`[OfflineSync] Unknown action type: ${action.type}`);
        }
      });

      // Haptic feedback on successful sync
      if (result.processed > 0) {
        void Haptic.notificationAsync(Haptic.NotificationFeedbackType.Success);
        void logAnalyticsEvent('offline_queue_sync_completed', {
          processed: result.processed,
          remaining: result.remaining,
        });
        if (__DEV__) {
          console.log(
            `[OfflineSync] ✓ Synced ${result.processed} action(s), ${result.remaining} remaining`
          );
        }
      }

      if (result.failed > 0) {
        void Haptic.notificationAsync(Haptic.NotificationFeedbackType.Warning);
        void logAnalyticsEvent('offline_queue_sync_partial_failure', { failed: result.failed });
        if (__DEV__) {
        console.warn(`[OfflineSync] ⚠ ${result.failed} action(s) failed to process`);
      }
      }

      if (!syncRequestedWhileRunning) {
        return;
      }

      console.log('[OfflineSync] Sync requested during active run, checking queue again...');
    } while (syncRequestedWhileRunning);
  } catch (error) {
    if (__DEV__) {
      console.error('[OfflineSync] Sync failed:', error);
    }
    void Haptic.notificationAsync(Haptic.NotificationFeedbackType.Error);
    void logAnalyticsEvent('offline_queue_sync_failed', {
      message: error instanceof Error ? error.message : 'unknown',
    });
  } finally {
    syncInProgress = false;
  }
};

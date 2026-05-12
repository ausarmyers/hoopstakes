import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import * as Haptic from 'expo-haptics';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { applyMatchToLeo } from '../lib/leo';
import { getAllowedStakes, isPaidTier } from '../lib/business-rules';
import { logAnalyticsEvent } from '../lib/telemetry';
import { reportMatch, submitMatchResult } from '../lib/backend';
import { getCourtById, isWithinCourtRadius } from '../lib/geo';
import { GEO_FENCE_RADIUS_METERS } from '../lib/constants';
import { retryWithBackoff } from '../lib/retry';
import { shouldQueueOfflineFirebaseError } from '../lib/firebase-errors';
import { enqueueAction } from '../lib/offlineQueue';
import { generateIdempotencyKey } from '../lib/idempotency';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { canPerformAction } from '../lib/store';
import ProfileModal from './components/ProfileModal';

const verifyGeofence = async (courtId: string): Promise<boolean> => {
  const court = getCourtById(courtId);
  if (!court) return false;

  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') return false;

    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return isWithinCourtRadius(
      { lat: position.coords.latitude, lng: position.coords.longitude },
      court,
      GEO_FENCE_RADIUS_METERS
    );
  } catch {
    return false;
  }
};

export default function GameConfirm() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  useOfflineSync(); // Monitor network and auto-sync offline actions
  const currentGym = useStore((s) => s.currentGym);
  const selectedStake = useStore((s) => s.selectedStake);

  const [myScore, setMyScore] = useState('11');
  const [opponentScore, setOpponentScore] = useState('7');
  const [submittedMatchId, setSubmittedMatchId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const currentCourt = currentGym ? getCourtById(currentGym) : undefined;

  if (!user) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center p-4">
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text className="mt-2 text-gray-500">Loading profile...</Text>
      </View>
    );
  }

  const allowedStakes = getAllowedStakes(user.tier);
  const effectiveStake = selectedStake ?? allowedStakes[0] ?? null;

  const margin = useMemo(() => {
    const mine = Number.parseInt(myScore, 10);
    const theirs = Number.parseInt(opponentScore, 10);
    if (Number.isNaN(mine) || Number.isNaN(theirs)) return null;
    return mine - theirs;
  }, [myScore, opponentScore]);

  const handleSubmit = async () => {
    const mine = Number.parseInt(myScore, 10);
    const theirs = Number.parseInt(opponentScore, 10);

    // Prevent double-tap: disable button immediately
    if (submitting) {
      if (__DEV__) {
        console.log('[GameConfirm] Submission already in progress, ignoring tap');
      }
      return;
    }

    if (Number.isNaN(mine) || Number.isNaN(theirs)) {
      Alert.alert('Invalid score', 'Enter valid numbers for both scores.');
      return;
    }

    if (mine <= theirs || margin === null || margin <= 0) {
      Alert.alert('Winner required', 'Your score must be higher. Margin is mandatory.');
      return;
    }

    if (isPaidTier(user.tier) && effectiveStake === null) {
      Alert.alert('Stake required', 'Paid tiers must include stakes for every match.');
      return;
    }

    if (!canPerformAction(user, 'submit_match')) {
      setProfileModalVisible(true);
      return;
    }

    if (!currentCourt) {
      Alert.alert('Check in first', 'Select and verify a court before submitting a match result.');
      return;
    }

    const isNearCourt = await verifyGeofence(currentCourt.id);
    if (!isNearCourt) {
      Alert.alert('Location Required', 'You must be near the court to submit a match.');
      return;
    }

    // Generate idempotency key to prevent duplicate submissions
    const idempotencyKey = generateIdempotencyKey('submit_match');

    setSubmitting(true);
    void Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Medium);

    try {
      const backend = await retryWithBackoff(async () => {
        return await submitMatchResult({
          opponentUid: 'mock-opponent-uid',
          myScore: mine,
          opponentScore: theirs,
          courtId: currentCourt.id,
          courtCity: currentCourt.city,
          courtHasAdmin: currentCourt.hasAdmin,
          courtQrCode: currentCourt.qrCode,
          idempotencyKey, // Pass to server for deduplication
        });
      }, 2, 1000);

      const nextLeo = applyMatchToLeo(user.leo, { won: true, margin });
      const earnedIncrease = isPaidTier(user.tier) && effectiveStake ? effectiveStake : 0;

      setUser({
        ...user,
        totalWins: user.totalWins + 1,
        xp: user.xp + 10,
        earnedBalance: user.earnedBalance + earnedIncrease,
        leo: nextLeo,
        lastMatchAt: new Date().toISOString(),
      });

        setSubmittedMatchId(backend.matchId);

      await logAnalyticsEvent('match_submitted', {
        winnerUid: user.uid,
        margin,
        opponentLEO: 72,
        tier: user.tier,
        stake: effectiveStake,
        matchId: backend.matchId,
        courtId: currentCourt.id,
        courtCity: currentCourt.city,
      });

      if (isPaidTier(user.tier)) {
        Alert.alert(
          'Record proof',
          'Cashout-eligible matches should be backed by a short video clip or opponent confirmation before payout.',
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Log reminder',
              onPress: () => {
                void logAnalyticsEvent('video_proof_prompted', {
                  source: 'match_result',
                  matchId: backend.matchId,
                  tier: user.tier,
                });
              },
            },
          ]
        );
      }

      void Haptic.notificationAsync(Haptic.NotificationFeedbackType.Success);
      Alert.alert(
        'Match submitted',
        `Score ${mine}-${theirs} recorded. Waiting for opponent confirmation.`
      );
    } catch (error: any) {
      void Haptic.notificationAsync(Haptic.NotificationFeedbackType.Error);

      if (__DEV__) {
        console.log('[GameConfirm] Network error, queueing match for offline sync');
      }

      // Queue only transient Firebase failures for offline sync.
      if (shouldQueueOfflineFirebaseError(error)) {
        try {
          const queueId = await enqueueAction({
            idempotencyKey,
            type: 'submit_match',
            payload: {
              uid: user!.uid,
              opponentUid: 'mock-opponent-uid',
              myScore: mine,
              oppScore: theirs,
              courtId: currentCourt.id,
              courtCity: currentCourt.city,
              courtHasAdmin: currentCourt.hasAdmin,
              courtQrCode: currentCourt.qrCode,
            },
          });

          // Still update local state for optimistic UI
          const nextLeo = applyMatchToLeo(user.leo, { won: true, margin });
          const earnedIncrease = isPaidTier(user.tier) && effectiveStake ? effectiveStake : 0;
          setUser({
            ...user,
            totalWins: user.totalWins + 1,
            xp: user.xp + 10,
            earnedBalance: user.earnedBalance + earnedIncrease,
            leo: nextLeo,
            lastMatchAt: new Date().toISOString(),
          });

          Alert.alert(
            '✅ Match Saved',
            'Submitted offline. Will sync when connection returns.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
          );
        } catch (queueError) {
          Alert.alert(
            'Save failed',
            'Could not queue match. Please check your connection and try again.'
          );
        }
      } else {
        // Other errors: show error alert
        Alert.alert('Submit failed', error?.message || 'Could not submit match result.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportMatch = async (reason: string) => {
    if (!submittedMatchId) {
      Alert.alert('Nothing to report', 'Submit a match first.');
      return;
    }

    try {
      await reportMatch(submittedMatchId, reason);
      await logAnalyticsEvent('match_reported', {
        reportedMatchId: submittedMatchId,
        reason,
        courtId: currentCourt?.id ?? null,
      });
      Alert.alert('Report sent', 'The match has been frozen for admin review.');
    } catch (error: any) {
      Alert.alert('Report failed', error?.message || 'Unable to report the match right now.');
    }
  };

  return (
    <View className="flex-1 bg-gray-50 px-6 pt-16">
      <Text className="text-3xl font-bold text-gray-900 mb-2">Confirm Match</Text>
      <Text className="text-gray-600 mb-6">Mandatory score entry keeps LEO transparent and trusted.</Text>

      <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-5">
        <Text className="text-xs text-gray-500 font-semibold mb-2">ENTER FINAL SCORE</Text>
        <View className="flex-row items-center justify-between gap-3">
          <TextInput
            value={myScore}
            onChangeText={setMyScore}
            keyboardType="number-pad"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-center text-2xl font-bold text-gray-900"
          />
          <Text className="text-2xl font-bold text-gray-500">-</Text>
          <TextInput
            value={opponentScore}
            onChangeText={setOpponentScore}
            keyboardType="number-pad"
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-center text-2xl font-bold text-gray-900"
          />
        </View>
      </View>

      <View className="bg-white rounded-2xl border border-orange-200 p-4 mb-5">
        <Text className="text-xs text-gray-500 font-semibold mb-2">AUTO-CALCULATED MARGIN</Text>
        <Text className="text-3xl font-bold text-orange-500">
          {margin === null ? '--' : margin > 0 ? `+${margin}` : margin}
        </Text>
      </View>

      <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-8">
        <Text className="text-xs text-gray-500 disabled={submitting} className={`bg-orange-500 rounded-2xl py-4 mb-3 ${submitting ? 'opacity-70' : ''}`}>
        {submitting ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-center font-bold text-lg">Submit Result</Text>
        )}
          {effectiveStake ? `$${effectiveStake.toFixed(2)} (mandatory for ${user.tier})` : 'Rookie mode: XP only'}
        </Text>
        {currentCourt && <Text className="text-xs text-gray-500 mt-2">Court: {currentCourt.name} | {currentCourt.city}</Text>}
      </View>

      <TouchableOpacity onPress={handleSubmit} className="bg-orange-500 rounded-2xl py-4 mb-3">
        <Text className="text-white text-center font-bold text-lg">Submit Result</Text>
      </TouchableOpacity>

      {submittedMatchId && (
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Report Match', 'Choose a reason', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Wrong score', onPress: () => void handleReportMatch('Wrong score') },
              { text: "Didn't play", onPress: () => void handleReportMatch("Didn't play") },
              { text: 'Cheating / foul play', onPress: () => void handleReportMatch('Cheating / foul play') },
            ]);
          }}
          className="bg-white border border-orange-200 rounded-2xl py-4 mb-3"
        >
          <Text className="text-orange-600 text-center font-bold text-lg">Report Match</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-center font-semibold text-gray-500">Cancel</Text>
      </TouchableOpacity>
    </View>

    <ProfileModal visible={profileModalVisible} onClose={() => setProfileModalVisible(false)} />
  );
}

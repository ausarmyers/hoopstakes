import { View, Text, ScrollView, RefreshControl, TouchableOpacity, Pressable, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import * as Haptic from 'expo-haptics';
import { router } from 'expo-router';
// TODO: Firebase - move leaderboard query to a typed data hook/repository.
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useStore } from '../../lib/store';
import { getDisplayedLEO, getLeoSkillTier } from '../../lib/leo';
import { isPaidTier } from '../../lib/business-rules';
import { RequireTier } from '../../lib/RequireTier';

export default function Home() {
  const user = useStore((s) => s.user);
  const tournaments = useStore((s) => s.tournaments);
  const [leaderboard, setLeaderboard] = useState<Array<{ id: string; displayName: string; leo: { score: number }; tier: string; winStreak: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  const paid = isPaidTier(user?.tier ?? 'Rookie');
  const displayedLEO = user ? getDisplayedLEO(user) : 0;
  const leoTier = getLeoSkillTier(displayedLEO);
  const isCalibrating = (user?.leo.totalGames ?? 0) < 3;

  const fetchLeaderboard = async () => {
    if (!user?.city) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      // TODO: Firebase - replace direct Firestore reads with centralized data service.
      const q = query(
        collection(db, 'users'),
        where('city', '==', user.city),
        where('profileComplete', '==', true),
        orderBy('leo.score', 'desc'),
        limit(10)
      );

      const snap = await getDocs(q);
      setLeaderboard(
        snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as any),
        }))
      );
      setLeaderboardError(null);
    } catch (error) {
      setLeaderboardError("Hmm, that didn't work. Try again?");
      if (__DEV__) {
        console.error('Leaderboard fetch failed:', error);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchLeaderboard();
  }, [user?.city]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
    await fetchLeaderboard();
  };

  const requireProfile = (action: () => void) => {
    if (!user?.profileComplete) {
      void Haptic.notificationAsync(Haptic.NotificationFeedbackType.Warning);
      Alert.alert('Complete Profile', 'Add your position and city to play.');
      return;
    }
    action();
  };

  if (!user || loading) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4 bg-white border-b border-gray-200">
          <View className="h-8 w-32 bg-gray-200 rounded" />
          <View className="h-4 w-48 bg-gray-200 rounded mt-2" />
        </View>
        <View className="mx-4 mt-4 p-4 bg-white rounded-xl border border-gray-200">
          <View className="h-6 w-24 bg-gray-200 rounded" />
          <View className="h-4 w-32 bg-gray-200 rounded mt-2" />
        </View>
        {[1, 2, 3].map((item) => (
          <View key={item} className="mx-4 mt-3 p-3 bg-white rounded-lg border border-gray-200">
            <View className="flex-row justify-between">
              <View className="h-5 w-20 bg-gray-200 rounded" />
              <View className="h-5 w-8 bg-gray-200 rounded" />
            </View>
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View className="bg-orange-500 px-6 pt-10 pb-8">
        <Text className="text-white/80 text-base">Welcome back</Text>
        <Text className="text-white text-3xl font-bold mb-4">{user.name}</Text>

        <View className="rounded-2xl bg-white/15 p-4 border border-white/30">
          <Text className="text-white/80 text-xs font-semibold">YOUR LEO</Text>
          <Text className="text-white text-4xl font-bold mt-1">{displayedLEO}</Text>
          <Text className="text-white/85 text-xs mt-1">
            {isCalibrating ? 'Calibrating... (play 3 games for full ranking)' : 'Built from win rate, margin, streak, and weekly activity.'}
          </Text>
          <Text className="text-white font-semibold text-xs mt-2">{user.positionAbbr} | {leoTier}</Text>
        </View>
      </View>

      <View className="px-6 py-6">
        <Text className="text-lg font-bold text-gray-900 mb-3">Player Snapshot</Text>
        <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-6">
          <Text className="text-gray-900 font-bold text-base">{user.name}</Text>
          <Text className="text-gray-600 text-sm mt-1">Position: {user.positionAbbr}</Text>
          <Text className="text-gray-600 text-sm">Hooper Tier: {leoTier}</Text>
          <Text className="text-gray-600 text-sm">Transparent formula with exact point math available.</Text>
          <TouchableOpacity
            onPress={() => Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light)}
            className="mt-3 self-start rounded-xl bg-orange-500 px-4 py-2"
          >
            <Text className="text-white text-xs font-bold">View LEO Breakdown</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-3">Balances</Text>
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 rounded-2xl bg-white p-4 border border-gray-200">
            <Text className="text-xs text-gray-500 font-semibold">GAMEPLAY</Text>
            <Text className="text-2xl font-bold text-gray-900 mt-1">${user.gameplayBalance.toFixed(2)}</Text>
            <Text className="text-xs text-gray-500 mt-1">One-time grant only</Text>
          </View>

          <View className="flex-1 rounded-2xl bg-white p-4 border border-gray-200">
            <Text className="text-xs text-gray-500 font-semibold">EARNED</Text>
            {paid ? (
              <>
                <Text className="text-2xl font-bold text-orange-500 mt-1">${user.earnedBalance.toFixed(2)}</Text>
                <Text className="text-xs text-gray-500 mt-1">Cashout enabled by tier rules</Text>
              </>
            ) : (
              <>
                <Text className="text-lg font-bold text-gray-400 mt-2">Hidden</Text>
                <Text className="text-xs text-gray-500 mt-1">Upgrade to view earned balance</Text>
              </>
            )}
          </View>
        </View>

        <Text className="text-lg font-bold text-gray-900 mb-3">Quick Actions</Text>
        <View className="gap-3 mb-6">
          <TouchableOpacity
            onPress={() =>
              requireProfile(() => {
                void Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)/find-game');
              })
            }
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <Text className="font-bold text-gray-900">Find Fair Matchups</Text>
            <Text className="text-xs text-gray-600 mt-1">LEO-based 1v1 pairing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              requireProfile(() => {
                void Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Medium);
                router.push('/match-confirm');
              })
            }
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <Text className="text-white font-medium text-center">Submit Win</Text>
            <Text className="text-xs text-gray-600 mt-1">Mandatory score + auto margin</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              requireProfile(() => {
                void Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                router.push('/tournament-hub');
              })
            }
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <Text className="font-bold text-gray-900">Tournament Hub</Text>
            <Text className="text-xs text-gray-600 mt-1">Video-proof winners and tier entry rules</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              requireProfile(() => {
                const hasAdminAccess = user?.tier?.toLowerCase() === 'elite' || Boolean((user as any)?.isAdmin);
                if (hasAdminAccess) {
                  void Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                  router.push('/admin-dashboard');
                  return;
                }

                void Haptic.notificationAsync(Haptic.NotificationFeedbackType.Warning);
                Alert.alert('Elite Only', 'Admin features require Elite tier.');
              })
            }
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <Text className="font-bold text-gray-900">Admin Dashboard</Text>
            <Text className="text-xs text-gray-600 mt-1">Conversion, retention, trust metrics</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              requireProfile(() => {
                void Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                router.push('/match-disputes');
              })
            }
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <Text className="font-bold text-gray-900">Confirm or Dispute Match</Text>
            <Text className="text-xs text-gray-600 mt-1">Dual confirmation with dispute escalation</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              requireProfile(() => {
                void Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Medium);
                router.push('/(tabs)/wallet');
              })
            }
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <Text className="font-bold text-gray-900">Cash Out Earnings</Text>
            <Text className="text-xs text-gray-600 mt-1">Open wallet and request payout</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              void Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
              router.push('/offline-queue');
            }}
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <Text className="font-bold text-gray-900">Offline Queue</Text>
            <Text className="text-xs text-gray-600 mt-1">Review pending sync actions and retries</Text>
          </TouchableOpacity>
        </View>

        <RequireTier
          minTier="hoopster"
          fallback={
            <View className="mx-4 mt-4 p-4 bg-gray-100 rounded">
              <Text className="text-center text-gray-600">Upgrade to see live players</Text>
              <Pressable
                className="mt-1"
                onPress={() => {
                  void Haptic.impactAsync(Haptic.ImpactFeedbackStyle.Light);
                  router.push('/(auth)/tier-selection');
                }}
              >
                <Text className="text-center text-orange-600 text-sm font-medium">View Plans →</Text>
              </Pressable>
            </View>
          }
        >
          <View className="gap-4 pb-10">
            <Text className="text-lg font-semibold mb-2">🔴 Live at Nearby Courts</Text>

            {leaderboard.length === 0 ? (
              <Text className="text-gray-500 text-center py-4">No players nearby yet. Be the first!</Text>
            ) : (
              leaderboard.map((player) => (
                <View key={player.id} className={`p-3 rounded-lg border border-gray-200 ${player.id === user.uid ? 'bg-orange-50' : 'bg-white'}`}>
                  <View className="flex-row justify-between">
                    <Text className="font-medium">{player.displayName} {player.id === user.uid ? '(You)' : ''}</Text>
                    <View className="flex-row gap-1">
                      <Text className="text-orange-600 font-bold">{player.leo.score}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}

            {leaderboardError && (
              <View className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <Text className="text-red-700 text-sm">{leaderboardError}</Text>
                <Pressable
                  onPress={() => {
                    setLeaderboardError(null);
                    void fetchLeaderboard();
                  }}
                  className="mt-1"
                >
                  <Text className="text-red-600 text-xs font-medium">Retry →</Text>
                </Pressable>
              </View>
            )}
          </View>
        </RequireTier>

        <Text className="text-lg font-bold text-gray-900 mb-3">Upcoming Tournaments</Text>
        <View className="gap-3 pb-10">
          {tournaments.map((t) => (
            <View key={t.id} className="bg-white border border-gray-200 rounded-2xl p-4">
              <Text className="font-bold text-gray-900">{t.name}</Text>
              <Text className="text-xs text-gray-600 mt-1">{t.venueType.toUpperCase()} | {t.stakeLabel} | {t.minTier}+ </Text>
              <Text className="text-xs text-orange-600 mt-1">Video proof required: {t.videoProofRequired ? 'Yes' : 'No'}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

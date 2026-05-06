import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useStore } from '../../lib/store';
import { router } from 'expo-router';
import { getAllowedStakes, isPaidTier } from '../../lib/business-rules';
import { getLeoSkillTier } from '../../lib/leo';
import { collection, limit, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';

type RosterHooper = {
  id: string;
  username: string;
  positionAbbr: string;
  tier: string;
  leo: number;
  wins: number;
  losses: number;
  venue: string;
};

export default function FindGame() {
  const user = useStore((s) => s.user);
  const currentGym = useStore((s) => s.currentGym);
  const selectedStake = useStore((s) => s.selectedStake);
  const setSelectedStake = useStore((s) => s.setSelectedStake);
  const [hoopers, setHoopers] = useState<RosterHooper[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [rosterError, setRosterError] = useState<string | null>(null);

  if (!user) return <Text className="text-center mt-10">Loading...</Text>;

  if (!currentGym) {
    return (
      <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
        <View className="px-6 pt-8 pb-6">
          <Text className="text-3xl font-bold text-gray-900 mb-4">Find a Game</Text>
        </View>

        <View className="px-6">
          <View className="bg-orange-50 rounded-3xl border-2 border-orange-200 p-8 items-center">
            <Text className="text-6xl mb-4">📍</Text>
            <Text className="text-xl font-bold text-gray-900 mb-2">Check In First</Text>
            <Text className="text-gray-600 text-center mb-6 leading-5">
              Visit Gyms and check in before challenging nearby hoopers.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/gym-map')}
              className="bg-orange-500 rounded-2xl px-8 py-4 w-full active:opacity-80"
            >
              <Text className="text-white text-center font-bold text-lg">Go to Gyms</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const paid = isPaidTier(user.tier);
  const allowedStakes = getAllowedStakes(user.tier);

  useEffect(() => {
    if (!paid) {
      setHoopers([]);
      setRosterLoading(false);
      setRosterError(null);
      return;
    }

    setRosterLoading(true);
    const usersQuery = query(collection(db, 'users'), limit(40));

    const unsubscribe = onSnapshot(
      usersQuery,
      (snapshot) => {
        const next = snapshot.docs
          .map((doc) => {
            const data = doc.data() as any;
            const uid = String(data?.uid || doc.id);
            if (uid === user.uid) return null;

            const gymId = String(data?.currentGym || data?.currentGymId || '');
            if (currentGym && gymId && gymId !== currentGym) return null;

            return {
              id: doc.id,
              username: String(data?.username || `hooper_${doc.id.slice(0, 6)}`),
              positionAbbr: String(data?.positionAbbr || 'G'),
              tier: String(data?.tier || 'Rookie'),
              leo: Number(data?.leo?.score || 0),
              wins: Number(data?.leo?.wins || data?.totalWins || 0),
              losses: Number(data?.leo?.losses || data?.totalLosses || 0),
              venue: String(data?.activeVenueName || data?.homeCourtName || 'Nearby court'),
            } as RosterHooper;
          })
          .filter((entry): entry is RosterHooper => Boolean(entry));

        setHoopers(next);
        setRosterError(null);
        setRosterLoading(false);
      },
      (error) => {
        setRosterLoading(false);
        setRosterError(error.message || 'Could not load live hoopers.');
      }
    );

    return () => unsubscribe();
  }, [paid, currentGym, user.uid]);

  const handleChallenge = (opponentUsername: string) => {
    if (paid && !selectedStake) {
      Alert.alert('Stake required', 'Paid users must choose a stake before challenging.');
      return;
    }

    const stakeText = paid && selectedStake ? `for $${selectedStake.toFixed(2)}` : 'for XP only';
    Alert.alert('Challenge Sent', `You challenged @${opponentUsername} ${stakeText}.`);
  };

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-8 pb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Find a Game</Text>
        <Text className="text-gray-600">LEO-based matching from nearby parks and gyms.</Text>
      </View>

      {paid ? (
        <View className="px-6 mb-5">
          <Text className="text-xs font-bold text-gray-600 mb-3">MANDATORY STAKES</Text>
          <View className="flex-row gap-2">
            {allowedStakes.map((stake) => (
              <TouchableOpacity
                key={stake}
                onPress={() => setSelectedStake(stake)}
                className={`flex-1 rounded-xl py-3 border-2 ${
                  selectedStake === stake
                    ? 'bg-orange-500 border-orange-500'
                    : 'bg-gray-100 border-gray-300'
                }`}
              >
                <Text
                  className={`text-center font-bold ${
                    selectedStake === stake ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  ${stake.toFixed(2)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text className="text-xs text-gray-500 mt-2">No "play for fun" toggle for paid tiers.</Text>
        </View>
      ) : (
        <View className="mx-6 mb-5 rounded-2xl border border-green-200 bg-green-50 p-4">
          <Text className="font-bold text-green-800 mb-1">Rookie Mode</Text>
          <Text className="text-green-700 text-sm">Play for XP only. Upgrade to Hoopster to unlock stakes and earned balance.</Text>
        </View>
      )}

      <View className="px-6 pb-12">
        <Text className="text-lg font-bold text-gray-900 mb-4">
          {paid ? 'Active hoopers at your court' : 'Upgrade to see live active hoopers'}
        </Text>

        {!paid ? (
          <View className="rounded-2xl border border-orange-200 bg-orange-50 p-5">
            <Text className="text-sm text-gray-700 mb-3">
              Hoopster+ can see who is active right now and get faster fair-match pairings.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/tier-selection')}
              className="bg-orange-500 rounded-xl py-3"
            >
              <Text className="text-white font-bold text-center">Upgrade Tier</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="gap-4">
            {rosterLoading && (
              <View className="rounded-2xl border border-gray-200 p-4 bg-white">
                <Text className="text-sm text-gray-600">Loading live hoopers from roster...</Text>
              </View>
            )}

            {rosterError && (
              <View className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
                <Text className="text-sm text-amber-800">{rosterError}</Text>
              </View>
            )}

            {!rosterLoading && hoopers.length === 0 && (
              <View className="rounded-2xl border border-gray-200 p-4 bg-white">
                <Text className="text-sm text-gray-600">No active hoopers found yet for this court.</Text>
              </View>
            )}

            {hoopers.map((hooper) => {
              const games = hooper.wins + hooper.losses;
              const winRate = games > 0 ? Math.round((hooper.wins / games) * 100) : 0;
              const leoDiff = Math.abs(user.leo.score - hooper.leo);
              const hooperTier = getLeoSkillTier(hooper.leo);

              return (
                <View key={hooper.id} className="rounded-2xl border border-gray-200 p-4 bg-white">
                  <View className="flex-row justify-between items-start mb-3">
                    <View>
                      <Text className="text-lg font-bold text-gray-900">@{hooper.username}</Text>
                      <Text className="text-xs text-gray-500">{hooper.positionAbbr} | {hooperTier}</Text>
                      <Text className="text-xs text-gray-500 mt-1">{hooper.venue}</Text>
                    </View>
                    <View className="bg-orange-100 px-3 py-1 rounded-full">
                      <Text className="text-orange-700 font-bold text-xs">LEO {hooper.leo}</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3 mb-3">
                    <Text className="text-sm text-gray-700">{winRate}% win rate</Text>
                    <Text className="text-sm text-gray-700">LEO diff: {leoDiff}</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleChallenge(hooper.username)}
                    className="bg-orange-500 rounded-xl py-3"
                  >
                    <Text className="text-white text-center font-bold">Challenge</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

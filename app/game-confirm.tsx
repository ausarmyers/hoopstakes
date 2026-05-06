import { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { applyMatchToLeo } from '../lib/leo';
import { getAllowedStakes, isPaidTier } from '../lib/business-rules';
import { logAnalyticsEvent } from '../lib/telemetry';
import { submitMatchResult } from '../lib/backend';

export default function GameConfirm() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);
  const selectedStake = useStore((s) => s.selectedStake);

  const [myScore, setMyScore] = useState('11');
  const [opponentScore, setOpponentScore] = useState('7');

  if (!user) return null;

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

    try {
      const backend = await submitMatchResult({
        opponentUid: 'mock-opponent-uid',
        myScore: mine,
        opponentScore: theirs,
      });

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

      await logAnalyticsEvent('match_submitted', {
        winnerUid: user.uid,
        margin,
        opponentLEO: 72,
        tier: user.tier,
        stake: effectiveStake,
        matchId: backend.matchId,
      });

      const payout = earnedIncrease > 0 ? ` +$${earnedIncrease.toFixed(2)} earned.` : ' XP updated.';
      Alert.alert(
        'Match submitted',
        `Score ${mine}-${theirs} recorded.${payout} Waiting for opponent confirmation.`
      );
      router.back();
    } catch (error: any) {
      Alert.alert('Submit failed', error?.message || 'Could not submit match result.');
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
        <Text className="text-xs text-gray-500 font-semibold mb-2">MATCH STAKE</Text>
        <Text className="text-lg font-bold text-gray-900">
          {effectiveStake ? `$${effectiveStake.toFixed(2)} (mandatory for ${user.tier})` : 'Rookie mode: XP only'}
        </Text>
      </View>

      <TouchableOpacity onPress={handleSubmit} className="bg-orange-500 rounded-2xl py-4 mb-3">
        <Text className="text-white text-center font-bold text-lg">Submit Result</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text className="text-center font-semibold text-gray-500">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

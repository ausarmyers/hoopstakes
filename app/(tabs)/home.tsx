import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';
import { getLeoSkillTier } from '../../lib/leo';
import { isPaidTier } from '../../lib/business-rules';

export default function Home() {
  const user = useStore((s) => s.user);
  const tournaments = useStore((s) => s.tournaments);

  if (!user) return <Text className="text-center mt-10">Loading...</Text>;

  const paid = isPaidTier(user.tier);
  const leoTier = getLeoSkillTier(user.leo.score);

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="bg-orange-500 px-6 pt-10 pb-8">
        <Text className="text-white/80 text-base">Welcome back</Text>
        <Text className="text-white text-3xl font-bold mb-4">{user.name}</Text>

        <View className="rounded-2xl bg-white/15 p-4 border border-white/30">
          <Text className="text-white/80 text-xs font-semibold">YOUR LEO</Text>
          <Text className="text-white text-4xl font-bold mt-1">{user.leo.score}</Text>
          <Text className="text-white/85 text-xs mt-1">Built from win rate, margin, streak, and weekly activity.</Text>
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
            onPress={() => router.push('/leo-breakdown')}
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
          <TouchableOpacity onPress={() => router.push('/(tabs)/find-game')} className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="font-bold text-gray-900">Find Fair Matchups</Text>
            <Text className="text-xs text-gray-600 mt-1">LEO-based 1v1 pairing</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/game-confirm')} className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="font-bold text-gray-900">Submit Match Result</Text>
            <Text className="text-xs text-gray-600 mt-1">Mandatory score + auto margin</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/tournament-hub')} className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="font-bold text-gray-900">Tournament Hub</Text>
            <Text className="text-xs text-gray-600 mt-1">Video-proof winners and tier entry rules</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/admin-dashboard')} className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="font-bold text-gray-900">Admin Dashboard</Text>
            <Text className="text-xs text-gray-600 mt-1">Conversion, retention, trust metrics</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/match-disputes')} className="bg-white border border-gray-200 rounded-2xl p-4">
            <Text className="font-bold text-gray-900">Confirm or Dispute Match</Text>
            <Text className="text-xs text-gray-600 mt-1">Dual confirmation with dispute escalation</Text>
          </TouchableOpacity>
        </View>

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

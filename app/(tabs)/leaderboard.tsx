import { View, Text, ScrollView } from 'react-native';
import { useStore } from '../../lib/store';
import { getDisplayedLEO, getLeoSkillTier } from '../../lib/leo';

const MOCK_LEADERBOARD = [
  { id: '1', name: 'James Chen', positionAbbr: 'PG', tier: 'Elite', leo: { score: 91, totalGames: 12 }, winRate: 86, avgMargin: 4.8 },
  { id: '2', name: 'Maya Rivers', positionAbbr: 'SG', tier: 'Elite', leo: { score: 87, totalGames: 2 }, winRate: 82, avgMargin: 4.1 },
  { id: '3', name: 'Tre Carter', positionAbbr: 'PF', tier: 'Hoopster', leo: { score: 80, totalGames: 8 }, winRate: 79, avgMargin: 3.4 },
  { id: '4', name: 'Alex Lee', positionAbbr: 'SF', tier: 'Hoopster', leo: { score: 75, totalGames: 5 }, winRate: 76, avgMargin: 2.8 },
];

export default function Leaderboard() {
  const user = useStore((s) => s.user);
  const displayedLEO = user ? getDisplayedLEO(user) : 0;

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-8 pb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</Text>
        <Text className="text-gray-600">Ranked by transparent LEO score.</Text>
      </View>

      {user && (
        <View className="px-6 mb-5">
          <View className="bg-orange-500 rounded-2xl p-5">
            <Text className="text-white/80 text-xs font-semibold">YOUR LEO</Text>
            <Text className="text-white text-4xl font-bold">{displayedLEO}</Text>
            <Text className="text-white/90 text-xs mt-1">
              {Math.round(user.leo.winRate * 100)}% WR | Avg margin {user.leo.avgMargin.toFixed(1)}
            </Text>
          </View>
        </View>
      )}

      <View className="px-6 pb-10">
        {MOCK_LEADERBOARD.map((player) => (
          <View key={player.id} className="bg-white rounded-2xl border border-gray-200 p-4 mb-3">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-bold text-gray-900">{player.name}</Text>
              <View className="items-end">
                <Text className="text-orange-600 font-bold">LEO {getDisplayedLEO({ leo: player.leo as any })}</Text>
                {player.leo.totalGames < 3 && <Text className="text-xs text-gray-500">🎯 Calibrating</Text>}
              </View>
            </View>
            <Text className="text-xs text-gray-600">
              {player.positionAbbr} | {player.tier} | {getLeoSkillTier(getDisplayedLEO({ leo: player.leo as any }))}
            </Text>
            <Text className="text-xs text-gray-600 mt-1">
              {player.winRate}% win rate | avg margin {player.avgMargin}
            </Text>
          </View>
        ))}

        <View className="bg-white rounded-2xl border border-gray-200 p-4 mt-2">
          <Text className="font-bold text-gray-900 mb-2">How LEO is calculated</Text>
          <Text className="text-sm text-gray-700">
            LEO = (Win% x 70) + (Avg Margin x 20) + (Win Streak x 5) + (Games This Week x 1)
          </Text>
          <Text className="text-xs text-gray-500 mt-2">Every component is visible to players for transparent ranking.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../lib/store';
import { getLeoBreakdown, getLeoSkillTier } from '../lib/leo';
import { getLeoBreakdownDetails } from '../lib/backend';

type RemoteBreakdown = Awaited<ReturnType<typeof getLeoBreakdownDetails>>;

export default function LeoBreakdownScreen() {
  const user = useStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [remote, setRemote] = useState<RemoteBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const local = useMemo(() => {
    if (!user) return null;
    const breakdown = getLeoBreakdown(user.leo);
    return {
      player: {
        uid: user.uid,
        name: user.name,
        tier: user.tier,
        positionAbbr: user.positionAbbr,
        leoScore: user.leo.score,
        hooperTier: getLeoSkillTier(user.leo.score),
      },
      metrics: {
        winRate: user.leo.winRate,
        avgMargin: user.leo.avgMargin,
        winStreak: user.leo.winStreak,
        gamesThisWeek: user.leo.gamesThisWeek,
      },
      breakdown: {
        ...breakdown,
        total: user.leo.score,
      },
      formula: 'LEO = (Win% x 70) + (Avg Margin x 20) + (Win Streak x 5) + (Games This Week x 1)',
    };
  }, [user]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      try {
        setLoading(true);
        const result = await getLeoBreakdownDetails();
        if (alive) {
          setRemote(result);
          setError(null);
        }
      } catch (e) {
        if (alive) {
          setError('Live breakdown unavailable. Showing local profile metrics.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    run();
    return () => {
      alive = false;
    };
  }, []);

  const data = remote || local;

  if (!data) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-gray-700">No player data available.</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-10 pb-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4 self-start rounded-full border border-gray-300 px-3 py-1">
          <Text className="text-xs font-semibold text-gray-700">Back</Text>
        </TouchableOpacity>

        <Text className="text-3xl font-bold text-gray-900">LEO Breakdown</Text>
        <Text className="text-sm text-gray-600 mt-2">Exact point-by-point scoring for transparent ranking.</Text>
      </View>

      <View className="px-6 pb-12">
        <View className="rounded-2xl border border-gray-200 bg-white p-4 mb-4">
          <Text className="text-base font-bold text-gray-900">{data.player.name}</Text>
          <Text className="text-sm text-gray-600 mt-1">{data.player.positionAbbr} | {data.player.tier}</Text>
          <Text className="text-sm text-gray-600">Hooper Tier: {data.player.hooperTier}</Text>
          <Text className="text-4xl font-bold text-orange-500 mt-3">{data.player.leoScore}</Text>
        </View>

        {loading && (
          <View className="rounded-2xl border border-gray-200 bg-white p-4 mb-4 flex-row items-center">
            <ActivityIndicator size="small" color="#F97316" />
            <Text className="text-sm text-gray-600 ml-3">Loading live backend breakdown...</Text>
          </View>
        )}

        {error && (
          <View className="rounded-2xl border border-amber-300 bg-amber-50 p-4 mb-4">
            <Text className="text-sm text-amber-800">{error}</Text>
          </View>
        )}

        <View className="rounded-2xl border border-gray-200 bg-white p-4 mb-4">
          <Text className="text-base font-bold text-gray-900 mb-3">Stat Inputs</Text>
          <Text className="text-sm text-gray-700">Win rate: {Math.round(data.metrics.winRate * 100)}%</Text>
          <Text className="text-sm text-gray-700">Average margin: {data.metrics.avgMargin.toFixed(1)}</Text>
          <Text className="text-sm text-gray-700">Win streak: {data.metrics.winStreak}</Text>
          <Text className="text-sm text-gray-700">Games this week: {data.metrics.gamesThisWeek}</Text>
        </View>

        <View className="rounded-2xl border border-gray-200 bg-white p-4 mb-4">
          <Text className="text-base font-bold text-gray-900 mb-3">Point Contributions</Text>
          <Text className="text-sm text-gray-700">Win rate points: {data.breakdown.winRatePoints.toFixed(1)}</Text>
          <Text className="text-sm text-gray-700">Margin points: {data.breakdown.marginPoints.toFixed(1)}</Text>
          <Text className="text-sm text-gray-700">Streak points: {data.breakdown.streakPoints.toFixed(1)}</Text>
          <Text className="text-sm text-gray-700">Activity points: {data.breakdown.activityPoints.toFixed(1)}</Text>
          <Text className="text-base font-bold text-gray-900 mt-2">Total LEO: {data.breakdown.total}</Text>
        </View>

        <View className="rounded-2xl border border-gray-200 bg-white p-4">
          <Text className="text-base font-bold text-gray-900 mb-2">Formula</Text>
          <Text className="text-sm text-gray-700">{data.formula}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

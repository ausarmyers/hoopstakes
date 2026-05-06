import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useStore } from '../../lib/store';
import { router } from 'expo-router';
import { getLeoBreakdown, getLeoSkillTier } from '../../lib/leo';
import { isPaidTier } from '../../lib/business-rules';

export default function Profile() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  if (!user) return null;

  const paid = isPaidTier(user.tier);
  const breakdown = getLeoBreakdown(user.leo);
  const leoTier = getLeoSkillTier(user.leo.score);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: () => {
          setUser(null);
          router.replace('/(auth)/sign-in');
        },
        style: 'destructive',
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-8 pb-6">
        <Text className="text-3xl font-bold text-gray-900 mb-2">Profile</Text>
      </View>

      <View className="px-6 mb-5">
        <View className="bg-orange-500 rounded-3xl p-7 items-center">
          <Text className="text-5xl mb-3">🏀</Text>
          <Text className="text-white text-2xl font-bold mb-1">{user.name}</Text>
          <Text className="text-white/90 font-semibold">{user.positionAbbr} | {user.tier}</Text>
          <Text className="text-white/90 text-xs mt-1">LEO Hooper Tier: {leoTier}</Text>
          {user.tier === 'Elite' && <Text className="text-xs text-white mt-2">Elite badge active</Text>}
        </View>
      </View>

      <View className="px-6 mb-5">
        <Text className="text-lg font-bold text-gray-900 mb-3">Transparent LEO</Text>
        <View className="bg-white rounded-2xl border border-gray-200 p-4">
          <Text className="text-3xl font-bold text-orange-500 mb-3">{user.leo.score}</Text>
          <Text className="text-sm text-gray-700">{Math.round(user.leo.winRate * 100)}% win rate {'->'} {breakdown.winRatePoints.toFixed(1)} pts</Text>
          <Text className="text-sm text-gray-700">Avg margin {user.leo.avgMargin.toFixed(1)} {'->'} {breakdown.marginPoints.toFixed(1)} pts</Text>
          <Text className="text-sm text-gray-700">Win streak {user.leo.winStreak} {'->'} {breakdown.streakPoints.toFixed(1)} pts</Text>
          <Text className="text-sm text-gray-700 mb-3">Games this week {user.leo.gamesThisWeek} {'->'} {breakdown.activityPoints.toFixed(1)} pts</Text>
          <TouchableOpacity onPress={() => router.push('/leo-breakdown')} className="self-start rounded-xl bg-orange-500 px-4 py-2">
            <Text className="text-white text-xs font-bold">Open Full LEO Breakdown</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 mb-5">
        <Text className="text-lg font-bold text-gray-900 mb-3">Balances</Text>
        <View className="bg-white rounded-2xl border border-gray-200 p-4">
          <Text className="text-sm text-gray-700 mb-2">Gameplay: ${user.gameplayBalance.toFixed(2)}</Text>
          {paid ? (
            <Text className="text-sm text-gray-700">Earned: ${user.earnedBalance.toFixed(2)}</Text>
          ) : (
            <Text className="text-sm text-gray-500">Earned: Hidden for Rookie</Text>
          )}
        </View>
      </View>

      <View className="px-6 mb-7">
        <Text className="text-lg font-bold text-gray-900 mb-3">Account</Text>
        <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <View className="p-4 border-b border-gray-200">
            <Text className="text-xs text-gray-500">Email</Text>
            <Text className="font-semibold text-gray-900">{user.email}</Text>
          </View>
          <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
            <Text className="font-semibold text-gray-900">Subscription</Text>
            <View className={`px-3 py-1 rounded-full ${user.subscription.status === 'active' ? 'bg-green-100' : 'bg-gray-200'}`}>
              <Text className={`text-xs font-bold ${user.subscription.status === 'active' ? 'text-green-700' : 'text-gray-700'}`}>
                {user.subscription.status}
              </Text>
            </View>
          </View>
          <TouchableOpacity className="p-4 active:bg-gray-100" onPress={() => router.push('/(auth)/tier-selection')}>
            <Text className="text-orange-500 font-semibold">Manage Tier</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="px-6 pb-12">
        <TouchableOpacity onPress={handleSignOut} className="bg-red-500 rounded-2xl py-4">
          <Text className="text-white text-center font-bold text-lg">Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

import { View, Text, TouchableOpacity, ImageBackground, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';

export default function SignIn() {
  const setUser = useStore((s) => s.setUser);

  const baseUser = {
    gameplayBalance: 0,
    earnedBalance: 0,
    totalWins: 0,
    totalLosses: 0,
    xp: 0,
    level: 1,
    badges: [] as string[],
    lastMatchAt: null,
    leo: {
      score: 0,
      wins: 0,
      losses: 0,
      totalGames: 0,
      winRate: 0,
      avgMargin: 0,
      winStreak: 0,
      gamesThisWeek: 0,
      lastUpdated: new Date().toISOString(),
    },
  };

  const handleGoogleSignIn = () => {
    setUser({
      ...baseUser,
      uid: 'google-user-' + Date.now(),
      name: 'Alex Jordan',
      username: 'ajordan',
      email: 'alex.jordan@gmail.com',
      positionAbbr: 'PG',
      tier: 'Rookie',
      subscription: {
        stripeId: null,
        status: 'trial',
        nextBilling: null,
        gameplayGrantedOnce: false,
      },
    });
    router.replace('/(auth)/tier-selection');
  };

  const handleAppleSignIn = () => {
    setUser({
      ...baseUser,
      uid: 'apple-user-' + Date.now(),
      name: 'Jordan Smith',
      username: 'jordansmith',
      email: 'jordan.smith@icloud.com',
      positionAbbr: 'SG',
      tier: 'Rookie',
      subscription: {
        stripeId: null,
        status: 'trial',
        nextBilling: null,
        gameplayGrantedOnce: false,
      },
    });
    router.replace('/(auth)/tier-selection');
  };

  const handleDemoMode = () => {
    setUser({
      ...baseUser,
      uid: 'demo-user',
      name: 'Demo Player',
      username: 'demoplayer',
      email: 'demo@hoopstakes.com',
      positionAbbr: 'SF',
      tier: 'Hoopster',
      gameplayBalance: 5,
      earnedBalance: 25.50,
      totalWins: 8,
      totalLosses: 3,
      xp: 45,
      level: 2,
      badges: ['New Player'],
      leo: {
        score: 72,
        wins: 8,
        losses: 3,
        totalGames: 11,
        winRate: 8 / 11,
        avgMargin: 3.2,
        winStreak: 2,
        gamesThisWeek: 6,
        lastUpdated: new Date().toISOString(),
      },
      subscription: {
        stripeId: 'sub_demo123',
        status: 'active',
        nextBilling: '2026-04-01T00:00:00.000Z',
        gameplayGrantedOnce: true,
      },
    });
    router.replace('/(tabs)/home');
  };

  return (
    <ImageBackground
      source={{
        uri: 'https://images.unsplash.com/photo-1546519638-68711109d298?w=800&h=1200&fit=crop',
      }}
      style={{ flex: 1 }}
      blurRadius={8}
    >
      <View className="flex-1 bg-black/40">
        <ScrollView className="flex-1 justify-between" showsVerticalScrollIndicator={false}>
          {/* Logo Section */}
          <View className="px-6 pt-16 pb-8">
            <View className="items-center">
              <Text className="text-6xl mb-4">🏀</Text>
              <Text className="text-white text-5xl font-bold mb-2">HoopStakes</Text>
              <Text className="text-white/80 text-lg font-semibold">Play. Compete. Earn.</Text>
            </View>
          </View>

          {/* Features Preview */}
          <View className="px-6 py-8 space-y-4">
            <View className="flex-row items-start gap-4 bg-white/10 rounded-2xl p-4 border border-white/20">
              <Text className="text-3xl">🏆</Text>
              <View className="flex-1">
                <Text className="text-white font-bold text-base mb-1">Compete</Text>
                <Text className="text-white/80 text-sm">Challenge hoopers at nearby gyms</Text>
              </View>
            </View>

            <View className="flex-row items-start gap-4 bg-white/10 rounded-2xl p-4 border border-white/20">
              <Text className="text-3xl">💰</Text>
              <View className="flex-1">
                <Text className="text-white font-bold text-base mb-1">Earn</Text>
                <Text className="text-white/80 text-sm">Win games and cash out your earnings</Text>
              </View>
            </View>

            <View className="flex-row items-start gap-4 bg-white/10 rounded-2xl p-4 border border-white/20">
              <Text className="text-3xl">📈</Text>
              <View className="flex-1">
                <Text className="text-white font-bold text-base mb-1">Level Up</Text>
                <Text className="text-white/80 text-sm">Climb the leaderboard and unlock rewards</Text>
              </View>
            </View>
          </View>

          {/* Sign In Section */}
          <View className="px-6 pb-8">
            <Text className="text-white text-2xl font-bold mb-6 text-center">
              Join the Game
            </Text>

            {/* Google Sign In */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              className="bg-white rounded-2xl py-4 px-6 mb-3 flex-row items-center justify-center active:opacity-80"
            >
              <Text className="text-xl mr-3">🔤</Text>
              <Text className="text-gray-900 font-bold text-lg">Sign in with Google</Text>
            </TouchableOpacity>

            {/* Apple Sign In */}
            <TouchableOpacity
              onPress={handleAppleSignIn}
              className="bg-black/40 border-2 border-white rounded-2xl py-4 px-6 mb-4 flex-row items-center justify-center active:bg-white/10"
            >
              <Text className="text-xl mr-3">🍎</Text>
              <Text className="text-white font-bold text-lg">Sign in with Apple</Text>
            </TouchableOpacity>

            {/* Demo Mode */}
            <TouchableOpacity
              onPress={handleDemoMode}
              className="bg-orange-900 border-2 border-orange-400 rounded-2xl py-4 px-6 flex-row items-center justify-center active:opacity-80"
            >
              <Text className="text-xl mr-3">👤</Text>
              <Text className="text-orange-100 font-bold text-lg">Try Demo</Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-white/60 text-xs text-center mt-6">
              By signing in, you agree to our{'\n'}
              <Text className="text-orange-300 font-semibold">Terms of Service</Text> & <Text className="text-orange-300 font-semibold">Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

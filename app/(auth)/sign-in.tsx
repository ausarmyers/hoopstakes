import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useStore, isProfileComplete, User } from '../../lib/store';
import ProfileModal from '../components/ProfileModal';

export default function SignIn() {
  const setUser = useStore((s) => s.setUser);
  const user = useStore((s) => s.user);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

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

  useEffect(() => {
    if (user && !isProfileComplete(user)) {
      setProfileModalVisible(true);
    }
  }, [user]);

  const openProfileSetup = () => {
    setProfileModalVisible(true);
  };

  const handleProfileClose = () => {
    setProfileModalVisible(false);

    const activeUser = useStore.getState().user;
    if (activeUser && isProfileComplete(activeUser)) {
      router.replace('/(auth)/tier-selection');
    }
  };

  const makeInCompleteUser = (userOverrides: Partial<User>) => {
    setUser({
      ...baseUser,
      ...userOverrides,
      profileComplete: false,
    } as User);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    openProfileSetup();
  };

  const handleGoogleSignIn = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    makeInCompleteUser({
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
  };

  const handleAppleSignIn = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    makeInCompleteUser({
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
  };

  const handleDemoMode = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUser({
      ...baseUser,
      uid: 'demo-user',
      name: 'Demo Player',
      username: 'demoplayer',
      email: 'demo@hoopstakes.com',
      displayName: 'Demo Player',
      positionAbbr: 'SF',
      tier: 'Hoopster',
      gameplayBalance: 5,
      earnedBalance: 25.50,
      totalWins: 8,
      totalLosses: 3,
      xp: 45,
      profileComplete: true,
      level: 2,
    router.replace('/(auth)/tier-selection');
      leo: {
        score: 72,
        wins: 8,
    <View className="flex-1 bg-gray-950">
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1546519638-68711109d298?w=800&h=1200&fit=crop',
        }}
        style={{ flex: 1 }}
        blurRadius={8}
        onLoadEnd={() => setHeroLoaded(true)}
      >
        <View className="flex-1 bg-black/55">
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="px-6 pt-16 pb-8">
              <View className="items-center">
                <Text className="text-6xl mb-4">🏀</Text>
                <Text className="text-white text-5xl font-bold mb-2">HoopStakes</Text>
                <Text className="text-gray-600 mt-1">Turn hooping into stakes.</Text>
              </View>
            </View>

            <View className="px-6">
              <View className="rounded-[32px] bg-white/10 p-5 border border-white/15 overflow-hidden">
                {heroLoaded ? (
                  <View>
                    <View className="flex-row items-start gap-4 rounded-xl shadow-sm bg-white/10 p-4 mb-3 border border-white/15">
                      <Text className="text-3xl">🏆</Text>
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base mb-1">Compete</Text>
                        <Text className="text-white/80 text-sm">Challenge hoopers at nearby gyms</Text>
                      </View>
                    </View>

                    <View className="flex-row items-start gap-4 rounded-xl shadow-sm bg-white/10 p-4 mb-3 border border-white/15">
                      <Text className="text-3xl">💰</Text>
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base mb-1">Earn</Text>
                        <Text className="text-white/80 text-sm">Win games and cash out your earnings</Text>
                      </View>
                    </View>

                    <View className="flex-row items-start gap-4 rounded-xl shadow-sm bg-white/10 p-4 border border-white/15">
                      <Text className="text-3xl">📈</Text>
                      <View className="flex-1">
                        <Text className="text-white font-bold text-base mb-1">Level Up</Text>
                        <Text className="text-white/80 text-sm">Climb the leaderboard and unlock rewards</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View className="rounded-xl shadow-sm bg-white/10 p-4 mb-3">
                      <View className="h-4 w-1/3 rounded-full bg-white/25" />
                      <View className="mt-2 h-3 w-4/5 rounded-full bg-white/10" />
                    </View>
                    <View className="rounded-xl shadow-sm bg-white/10 p-4 mb-3">
                      <View className="h-4 w-1/4 rounded-full bg-white/25" />
                      <View className="mt-2 h-3 w-3/5 rounded-full bg-white/10" />
                    </View>
                    <View className="rounded-xl shadow-sm bg-white/10 p-4">
                      <View className="h-4 w-1/3 rounded-full bg-white/25" />
                      <View className="mt-2 h-3 w-2/3 rounded-full bg-white/10" />
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View className="px-6 pt-8 pb-8">
              <Text className="text-white text-2xl font-bold mb-2 text-center">
                {user && !isProfileComplete(user) ? 'Finish your setup' : 'Join the Game'}
              </Text>
              <Text className="text-white/75 text-center mb-6">
                {user && !isProfileComplete(user)
                  ? 'Complete your profile first so city matching and LEO tracking work correctly.'
                  : 'Start with your account, then choose your tier and jump into your local run.'}
              </Text>

              <Pressable
                onPress={handleGoogleSignIn}
                className="bg-white rounded-2xl py-4 px-6 mb-3 flex-row items-center justify-center active:opacity-80"
              >
                <Text className="text-xl mr-3">🔤</Text>
                <Text className="text-gray-900 font-bold text-lg">Sign in with Google</Text>
              </Pressable>

              <Pressable
                onPress={handleAppleSignIn}
                className="bg-black/40 border-2 border-white rounded-2xl py-4 px-6 mb-4 flex-row items-center justify-center active:bg-white/10"
              >
                <Text className="text-xl mr-3">🍎</Text>
                <Text className="text-white font-bold text-lg">Sign in with Apple</Text>
              </Pressable>

              <Pressable
                onPress={handleDemoMode}
                className="bg-orange-500 border border-orange-500 rounded-2xl py-4 px-6 flex-row items-center justify-center active:opacity-80"
              >
                <Text className="text-xl mr-3">👤</Text>
                <Text className="text-white font-bold text-lg">Try Demo</Text>
              </Pressable>

              <Text className="text-white/60 text-xs text-center mt-2">
                By signing in, you agree to our{'
'}
                <Text className="text-orange-300 font-semibold">Terms of Service</Text> &{' '}
                <Text className="text-orange-300 font-semibold">Privacy Policy</Text>
              </Text>
            </View>

            {!heroLoaded ? (
              <View className="absolute inset-0 items-center justify-center bg-black/20 px-6">
                <View className="w-full max-w-md rounded-[32px] bg-white/10 p-6 border border-white/10">
                  <View className="h-5 w-2/3 rounded-full bg-white/25" />
                  <View className="mt-2 h-4 w-4/5 rounded-full bg-white/10" />
                  <View className="mt-2 h-14 rounded-2xl bg-white/10" />
                  <View className="mt-2 h-14 rounded-2xl bg-white/10" />
                  <View className="mt-2 h-14 rounded-2xl bg-white/10" />
                  <View className="mt-2 items-center">
                    <ActivityIndicator color="#FF6B35" />
                  </View>
                </View>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </ImageBackground>

      <ProfileModal visible={profileModalVisible} onClose={handleProfileClose} />
    </View>
            {/* Demo Mode */}
            <TouchableOpacity
              onPress={handleDemoMode}
              className="bg-orange-900 border-2 border-orange-400 rounded-2xl py-4 px-6 flex-row items-center justify-center active:opacity-80"
            >
              <Text className="text-xl mr-3">👤</Text>
              <Text className="text-white font-bold text-lg">Try Demo</Text>
            </TouchableOpacity>

            {/* Terms */}
            <Text className="text-white/60 text-xs text-center mt-2">
              By signing in, you agree to our{'\n'}
              <Text className="text-orange-300 font-semibold">Terms of Service</Text> & <Text className="text-orange-300 font-semibold">Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../lib/store';

export default function Index() {
  const user = useStore((s) => s.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const target = user ? '/(tabs)/home' : '/(auth)/sign-in';
    const timer = setTimeout(() => {
      router.replace(target);
    }, 120);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 1);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 items-center justify-center bg-gray-50 px-6">
      <StatusBar barStyle="dark-content" />
      <View className="mb-8 h-24 w-24 items-center justify-center rounded-full bg-[#FF6B35]/10">
        <Text className="text-4xl">🏀</Text>
      </View>
      <Text className="text-center text-3xl font-bold text-gray-900">HoopStakes</Text>
      <Text className="mt-2 text-center text-base text-gray-600">
        {user ? 'Checking your profile setup...' : 'Preparing your onboarding...'}
      </Text>

      <View className="mt-8 w-full max-w-sm rounded-3xl bg-white p-5 shadow-sm">
        <View className="h-4 w-3/4 rounded-full bg-gray-200" />
        <View className="mt-4 h-4 w-1/2 rounded-full bg-gray-100" />
        <View className="mt-6 flex-row items-center gap-3">
          <View className="h-12 w-12 rounded-full bg-gray-200" />
          <View className="flex-1 gap-2">
            <View className="h-3 w-5/6 rounded-full bg-gray-200" />
            <View className="h-3 w-2/3 rounded-full bg-gray-100" />
          </View>
        </View>
        <View className="mt-4 h-12 rounded-2xl bg-gray-100" />
        <View className="mt-3 h-12 rounded-2xl bg-gray-50" />
      </View>

      <View className="mt-8 flex-row items-center gap-3">
        <ActivityIndicator color="#FF6B35" />
        <Text className="text-gray-500">Verifying your court access...</Text>
      </View>
    </View>
  );
}
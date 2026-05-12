import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { ACTIVE_CITIES, type ActiveCity } from '../lib/constants';
import { logAnalyticsEvent } from '../lib/telemetry';

function normalizeCityParam(value: string | string[] | undefined): ActiveCity | null {
  const city = Array.isArray(value) ? value[0] : value;
  if (city && ACTIVE_CITIES.includes(city as ActiveCity)) {
    return city as ActiveCity;
  }
  return null;
}

export default function WaitlistScreen() {
  const params = useLocalSearchParams<{ nearestCity?: string }>();
  const initialCity = useMemo(() => normalizeCityParam(params.nearestCity) ?? ACTIVE_CITIES[0], [params.nearestCity]);
  const [selectedCity, setSelectedCity] = useState<ActiveCity>(initialCity);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleJoinWaitlist = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Add your email', 'Use a valid email so we can notify you when HoopStakes launches in your city.');
      return;
    }

    setSubmitting(true);

    try {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // TODO: Firebase waitlist signup
      await logAnalyticsEvent('waitlist_joined', {
        city: selectedCity,
        emailDomain: trimmedEmail.split('@')[1]?.toLowerCase() ?? 'unknown',
      });

      Alert.alert('You are on the list', `We will notify ${trimmedEmail} when HoopStakes opens in ${selectedCity}.`);
      setEmail('');
      router.replace('/(auth)/sign-in');
    } catch (error) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Could not join waitlist', 'Please try again in a moment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="flex-1 px-6 pt-16 pb-10">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-[#FF6B35]/10 self-center">
            <Text className="text-4xl">🏀</Text>
          </View>

          <Text className="text-center text-3xl font-bold text-gray-900">
            HoopStakes is rolling out city by city.
          </Text>
          <Text className="mt-3 text-center text-base text-gray-600">
            We are starting with verified courts in launch cities. Pick your city, drop your email, and we will notify you first.
          </Text>

          <View className="mt-8 rounded-3xl bg-white p-5 shadow-sm">
            <Text className="text-sm font-semibold uppercase tracking-wide text-gray-500">Your launch city</Text>
            <View className="mt-3 flex-row flex-wrap gap-3">
              {ACTIVE_CITIES.map((city) => {
                const active = city === selectedCity;
                return (
                  <Pressable
                    key={city}
                    onPress={() => {
                      setSelectedCity(city);
                      void Haptics.selectionAsync();
                    }}
                    className={`rounded-full px-4 py-3 ${active ? 'bg-[#FF6B35]' : 'bg-gray-100'}`}
                  >
                    <Text className={`font-semibold ${active ? 'text-white' : 'text-gray-700'}`}>{city}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">Email address</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 text-base text-gray-900"
            />

            <Pressable
              onPress={() => void handleJoinWaitlist()}
              disabled={submitting}
              className={`mt-6 items-center rounded-2xl px-5 py-4 ${submitting ? 'bg-[#FF6B35]/70' : 'bg-[#FF6B35]'}`}
            >
              <Text className="text-base font-bold text-white">
                {submitting ? 'Saving...' : 'Notify on launch'}
              </Text>
            </Pressable>

            <Text className="mt-4 text-center text-xs text-gray-500">
              No spam. One email when your city opens.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
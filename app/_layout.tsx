import { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar as RNStatusBar } from 'react-native';
import * as Location from 'expo-location';
import { Redirect, Stack, usePathname } from 'expo-router';
import { Poppins_400Regular, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { StripeProvider } from '@stripe/stripe-react-native';
import { getNearestActiveCity, isInsideLaunchCity } from '../lib/geo';
import { useUserProfileSync } from '../lib/useUserProfileSync';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { OfflineQueueBanner } from './components/OfflineQueueBanner';

type GateState =
  | { status: 'loading'; nearestCity: string }
  | { status: 'allowed' }
  | { status: 'waitlist'; nearestCity: string };

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_700Bold });
  const [gate, setGate] = useState<GateState>({ status: 'loading', nearestCity: 'San Diego' });
  const pathname = usePathname();

  useUserProfileSync();
  useOfflineSync(); // Monitor network and auto-sync offline actions

  useEffect(() => {
    let alive = true;

    const evaluateGate = async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!alive) return;

        if (permission.status !== 'granted') {
          setGate({ status: 'waitlist', nearestCity: 'San Diego' });
          return;
        }

        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
        if (!alive) return;

        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const nearestCity = getNearestActiveCity(coords);

        if (isInsideLaunchCity(coords)) {
          setGate({ status: 'allowed' });
        } else {
          setGate({ status: 'waitlist', nearestCity });
        }
      } catch (error) {
        if (alive) {
          setGate({ status: 'waitlist', nearestCity: 'San Diego' });
          console.warn('Location gate failed', error);
        }
      }
    };

    evaluateGate();
    return () => {
      alive = false;
    };
  }, []);

  if (!fontsLoaded) return null;

  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  if (!stripeKey) {
    console.warn('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set; payments will be disabled.');
  }

  if (gate.status === 'waitlist' && pathname !== '/waitlist') {
    return <Redirect href={{ pathname: '/waitlist', params: { nearestCity: gate.nearestCity } }} />;
  }

  if (gate.status === 'loading') {
    return (
      <AppErrorBoundary>
        <StripeProvider
          publishableKey={stripeKey}
          merchantIdentifier="merchant.com.hoopstakes.app"
          urlScheme="hoopstakes"
        >
          <RNStatusBar barStyle="dark-content" />
          <ActivityIndicator color="#FF6B35" />
        </StripeProvider>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <StripeProvider
        publishableKey={stripeKey}
        merchantIdentifier="merchant.com.hoopstakes.app"
        urlScheme="hoopstakes"
      >
        <RNStatusBar barStyle="dark-content" />
        {gate.status === 'allowed' ? (
          <>
            <Stack screenOptions={{ headerShown: false }} />
            <OfflineQueueBanner />
          </>
        ) : (
          <Stack screenOptions={{ headerShown: false }} />
        )}
      </StripeProvider>
    </AppErrorBoundary>
  );
}
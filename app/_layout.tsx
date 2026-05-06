import { Stack } from 'expo-router';
import { StatusBar as RNStatusBar } from 'react-native';
import { Poppins_400Regular, Poppins_700Bold, useFonts } from '@expo-google-fonts/poppins';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_700Bold });
  if (!fontsLoaded) return null;

  const stripeKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  if (!stripeKey) {
    console.warn('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set; payments will be disabled.');
  }

  return (
    <StripeProvider
      publishableKey={stripeKey}
      merchantIdentifier="merchant.com.hoopstakes.app"
      urlScheme="hoopstakes"
    >
      <RNStatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: false }} />
    </StripeProvider>
  );
}
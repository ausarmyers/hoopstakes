import { Linking } from 'react-native';
import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export const createSubscription = async (tier: 'Hoopster' | 'Elite') => {
  const createCheckout = httpsCallable(functions, 'createStripeCheckout');
  const response = await createCheckout({ tier: tier.toLowerCase() });
  const { checkoutUrl } = response.data as { checkoutUrl: string };
  if (!checkoutUrl) {
    throw new Error('Missing checkout URL from backend.');
  }
  await Linking.openURL(checkoutUrl);
  return true;
};
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../lib/store';

const TIERS = [
  {
    name: 'Rookie',
    price: 'Free',
    icon: '🎯',
    description: 'Start proving your game',
    features: ['Find games', 'Track stats', 'Basic LEO view', 'XP-only matches'],
    popular: false,
    colors: 'bg-green-500',
  },
  {
    name: 'Hoopster',
    price: '$5/month',
    icon: '⭐',
    description: 'For serious weekly players',
    features: ['Mandatory $0.25 stakes', 'Cashout at $10 min', 'See active hoopers', 'Full LEO breakdown'],
    popular: true,
    colors: 'bg-blue-500',
  },
  {
    name: 'Elite',
    price: '$10/month',
    icon: '👑',
    description: 'Top-tier competitive access',
    features: [
      'Mandatory stakes: $0.25 / $0.50 / $1.00',
      'Cashout at $5 min',
      'Priority matching',
      'Exclusive high-stakes tournaments',
    ],
    popular: false,
    colors: 'bg-purple-500',
  },
];

export default function TierSelection() {
  const user = useStore((s) => s.user);
  const setUser = useStore((s) => s.setUser);

  const handleSelectTier = (tierName: string) => {
    setUser((u) => {
      if (!u) return null;

      const nextTier = tierName as 'Rookie' | 'Hoopster' | 'Elite';
      const shouldGrantGameplay =
        !u.subscription.gameplayGrantedOnce && (nextTier === 'Hoopster' || nextTier === 'Elite');
      const oneTimeGameplayGrant = nextTier === 'Elite' ? 10 : nextTier === 'Hoopster' ? 5 : 0;

      return {
        ...u,
        tier: nextTier,
        gameplayBalance: shouldGrantGameplay ? oneTimeGameplayGrant : u.gameplayBalance,
        subscription: {
          ...u.subscription,
          status: nextTier === 'Rookie' ? 'trial' : 'active',
          gameplayGrantedOnce: shouldGrantGameplay || u.subscription.gameplayGrantedOnce,
        },
      };
    });

    router.replace('/(tabs)/home');
  };

  return (
    <ScrollView className="flex-1 bg-white" showsVerticalScrollIndicator={false}>
      <View className="px-6 pt-8 pb-6">
        <Text className="text-4xl font-bold text-gray-900 mb-2">Choose Your Tier</Text>
        <Text className="text-gray-600 text-lg">{user?.name}, pick your competitive path.</Text>
      </View>

      <View className="px-6 pb-12">
        {TIERS.map((tier) => (
          <TouchableOpacity
            key={tier.name}
            onPress={() => handleSelectTier(tier.name)}
            className={`mb-4 rounded-3xl overflow-hidden border-2 ${tier.popular ? 'border-orange-500' : 'border-gray-200'}`}
          >
            <View className={`${tier.colors} p-6 pb-8`}>
              <Text className="text-6xl mb-3">{tier.icon}</Text>
              <Text className="text-white text-3xl font-bold mb-1">{tier.name}</Text>
              <Text className="text-white/90 text-sm font-semibold mb-4">{tier.description}</Text>

              <View className="bg-white/20 rounded-2xl p-4 mb-5 border border-white/40">
                <Text className="text-white/80 text-xs font-semibold mb-1">Price</Text>
                <Text className="text-white text-2xl font-bold">{tier.price}</Text>
              </View>

              {tier.features.map((feature) => (
                <Text key={feature} className="text-white text-sm mb-1">• {feature}</Text>
              ))}
            </View>

            <View className={`px-6 py-4 ${tier.popular ? 'bg-orange-50' : 'bg-gray-50'}`}>
              <View className={`${tier.colors} rounded-2xl py-4 items-center`}>
                <Text className="text-white font-bold text-lg">Choose {tier.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View className="px-6 pb-8">
        <View className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <Text className="font-bold text-gray-900 mb-3 text-lg">Plan Rules</Text>
          <Text className="text-gray-700 text-sm leading-5">
            • Paid tiers require stakes every match{`\n`}
            • Gameplay balance is one-time only{`\n`}
            • Cashout must leave at least $1 in earned balance{`\n`}
            • No ads, ever
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

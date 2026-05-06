import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useStore } from '../lib/store';
import { router } from 'expo-router';

type Tier = 'rookie' | 'hoopster' | 'elite';

interface RequireTierProps {
  minTier: Tier;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgrade?: boolean;
}

const TIER_HIERARCHY: Record<Tier, number> = {
  rookie: 0,
  hoopster: 1,
  elite: 2,
};

export function RequireTier({
  minTier,
  children,
  fallback,
  showUpgrade = true,
}: RequireTierProps) {
  const user = useStore((s) => s.user);

  if (!user) {
    return fallback || null;
  }

  const userTier = user.tier.toLowerCase() as Tier;
  const userLevel = TIER_HIERARCHY[userTier];
  const requiredLevel = TIER_HIERARCHY[minTier];

  // User has sufficient tier
  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  // User doesn't have required tier
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show upgrade prompt by default
  if (showUpgrade) {
    return (
      <View className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border-2 border-orange-200">
        <View className="flex-row items-center gap-3 mb-3">
          <Text className="text-3xl">🔒</Text>
          <View>
            <Text className="text-orange-900 font-bold text-lg">
              {minTier === 'hoopster' ? 'Hoopster' : 'Elite'} Only
            </Text>
            <Text className="text-orange-700 text-sm">
              Upgrade to unlock this feature
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => router.push('/(auth)/tier-selection')}
          className="bg-orange-500 rounded-xl py-3 px-4 active:opacity-80"
        >
          <Text className="text-white font-bold text-center">
            Upgrade to {minTier === 'hoopster' ? 'Hoopster ($5/mo)' : 'Elite ($10/mo)'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Hide completely if showUpgrade is false
  return null;
}

// Helper hook for checking tier access in logic
export function useHasTier(minTier: Tier): boolean {
  const user = useStore((s) => s.user);

  if (!user) return false;

  const userTier = user.tier.toLowerCase() as Tier;
  const userLevel = TIER_HIERARCHY[userTier];
  const requiredLevel = TIER_HIERARCHY[minTier];

  return userLevel >= requiredLevel;
}

// Helper to get tier badge icon
export function getTierIcon(tier: string): string {
  const tierLower = tier.toLowerCase();
  if (tierLower === 'elite') return '👑';
  if (tierLower === 'hoopster') return '⭐';
  return '🎯'; // Rookie
}

// Helper to get tier color class
export function getTierColorClass(tier: string): string {
  const tierLower = tier.toLowerCase();
  if (tierLower === 'elite') return 'bg-purple-500';
  if (tierLower === 'hoopster') return 'bg-blue-500';
  return 'bg-green-500'; // Rookie
}

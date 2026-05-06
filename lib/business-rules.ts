import { Tier } from './store';

export const HOOPSTAKES_COLORS = {
  primary: '#FF6B35',
  dark: '#2D3748',
  light: '#F7FAFC',
} as const;

export function isPaidTier(tier: Tier): boolean {
  return tier === 'Hoopster' || tier === 'Elite';
}

export function getCashoutMinimum(tier: Tier): number | null {
  if (tier === 'Hoopster') return 10;
  if (tier === 'Elite') return 5;
  return null;
}

export function getAllowedStakes(tier: Tier): Array<0.25 | 0.5 | 1> {
  if (tier === 'Elite') return [0.25, 0.5, 1];
  if (tier === 'Hoopster') return [0.25];
  return [];
}

export function canCashout(tier: Tier, earnedBalance: number): {
  allowed: boolean;
  reason?: string;
} {
  const minimum = getCashoutMinimum(tier);
  if (minimum === null) {
    return { allowed: false, reason: 'Cashout is only available for paid tiers.' };
  }

  if (earnedBalance < minimum) {
    return {
      allowed: false,
      reason: `${tier} needs at least $${minimum.toFixed(2)} earned balance to cash out.`,
    };
  }

  return { allowed: true };
}

export function violatesRetainedBalanceRule(
  earnedBalance: number,
  cashoutAmount: number
): boolean {
  return earnedBalance - cashoutAmount < 1;
}

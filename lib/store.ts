import { create } from 'zustand';

export type Tier = 'Rookie' | 'Hoopster' | 'Elite';
export type PositionAbbr = 'PG' | 'SG' | 'SF' | 'PF' | 'C' | 'G' | 'F';

export interface LeoState {
  score: number;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number; // 0-1
  avgMargin: number;
  winStreak: number;
  gamesThisWeek: number;
  lastUpdated: string;
}

export interface Tournament {
  id: string;
  name: string;
  venueType: 'park' | 'gym';
  startsAt: string;
  minTier: Tier;
  stakeLabel: string;
  videoProofRequired: boolean;
}

export interface User {
  uid: string;
  name: string;
  username: string;
  email: string;
  positionAbbr: PositionAbbr;
  tier: Tier;
  gameplayBalance: number;
  earnedBalance: number;
  leo: LeoState;
  totalWins: number;
  totalLosses: number;
  xp: number;
  level: number;
  badges: string[];
  lastMatchAt: string | null;
  subscription: {
    stripeId: string | null;
    status: 'active' | 'inactive' | 'canceled' | 'past_due' | 'trial';
    nextBilling: string | null; // ISO date string
    gameplayGrantedOnce: boolean;
  };
}

export interface Gym {
  id: string;
  name: string;
  address: string;
  coordinates: { lat: number; lng: number };
  qrCode: string;
  menu: Array<{ item: string; price: number }>;
}

interface StoreState {
  user: User | null;
  setUser: (user: User | null | ((prev: User | null) => User | null)) => void;
  currentGym: string | null;
  setCurrentGym: (gymId: string | null) => void;
  selectedStake: 0.25 | 0.5 | 1 | null;
  setSelectedStake: (stake: 0.25 | 0.5 | 1 | null) => void;
  tournaments: Tournament[];
  gyms: Gym[];
}

const MOCK_GYMS: Gym[] = [
  {
    id: 'USD_MAIN',
    name: 'USD Recreation Center',
    address: '5998 Alcalá Park, San Diego, CA',
    coordinates: { lat: 32.771, lng: -117.189 },
    qrCode: 'USD_MAIN',
    menu: [
      { item: 'Water', price: 2 },
      { item: 'Powerade', price: 3 },
      { item: 'Protein Bar', price: 4 },
    ],
  },
];

export const useStore = create<StoreState>((set) => ({
  user: {
    uid: 'mock-user',
    name: 'Ausar Myers',
    username: 'ausarmyers',
    email: 'ausar@example.com',
    positionAbbr: 'SG',
    tier: 'Elite',
    gameplayBalance: 10,
    earnedBalance: 7.25,
    leo: {
      score: 78,
      wins: 8,
      losses: 2,
      totalGames: 10,
      winRate: 0.8,
      avgMargin: 4.2,
      winStreak: 3,
      gamesThisWeek: 10,
      lastUpdated: '2026-03-10T20:00:00.000Z',
    },
    totalWins: 12,
    totalLosses: 5,
    xp: 23,
    level: 3,
    badges: ['Founding16'],
    lastMatchAt: '2026-03-10T20:00:00.000Z',
    subscription: {
      stripeId: 'sub_mock123',
      status: 'active',
      nextBilling: '2026-02-18T00:00:00Z',
      gameplayGrantedOnce: true,
    },
  },
  setUser: (userOrFn) =>
    set((s) => ({ user: typeof userOrFn === 'function' ? (userOrFn as any)(s.user) : userOrFn })),
  currentGym: 'USD_MAIN',
  setCurrentGym: (gymId) => set({ currentGym: gymId }),
  selectedStake: 0.5,
  setSelectedStake: (stake) => set({ selectedStake: stake }),
  tournaments: [
    {
      id: 'park-sd-1',
      name: 'Balboa Park Saturday Run',
      venueType: 'park',
      startsAt: '2026-03-15T17:00:00.000Z',
      minTier: 'Hoopster',
      stakeLabel: '$0.25 entry',
      videoProofRequired: true,
    },
    {
      id: 'gym-sd-elite',
      name: 'Mission Valley Elite Night',
      venueType: 'gym',
      startsAt: '2026-03-19T02:00:00.000Z',
      minTier: 'Elite',
      stakeLabel: '$1.00 entry',
      videoProofRequired: true,
    },
  ],
  gyms: MOCK_GYMS,
}));

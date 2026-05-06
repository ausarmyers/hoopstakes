import { LeoState } from './store';

export interface MatchInput {
  won: boolean;
  margin: number;
}

export interface LeoBreakdown {
  winRatePoints: number;
  marginPoints: number;
  streakPoints: number;
  activityPoints: number;
}

export type LeoSkillTier =
  | 'Rising Hooper'
  | 'Street Certified'
  | 'Gym Proven'
  | 'Elite Run'
  | 'Legend Circuit';

export function calculateLeoScore(leo: LeoState): number {
  const breakdown = getLeoBreakdown(leo);
  return Math.round(
    breakdown.winRatePoints +
      breakdown.marginPoints +
      breakdown.streakPoints +
      breakdown.activityPoints
  );
}

export function getLeoBreakdown(leo: LeoState): LeoBreakdown {
  return {
    winRatePoints: leo.winRate * 70,
    marginPoints: leo.avgMargin * 20,
    streakPoints: leo.winStreak * 5,
    activityPoints: leo.gamesThisWeek,
  };
}

export function getLeoSkillTier(score: number): LeoSkillTier {
  if (score >= 90) return 'Legend Circuit';
  if (score >= 80) return 'Elite Run';
  if (score >= 70) return 'Gym Proven';
  if (score >= 60) return 'Street Certified';
  return 'Rising Hooper';
}

export function applyMatchToLeo(leo: LeoState, input: MatchInput): LeoState {
  const wins = leo.wins + (input.won ? 1 : 0);
  const losses = leo.losses + (input.won ? 0 : 1);
  const totalGames = wins + losses;

  const totalMargin = leo.avgMargin * leo.totalGames + input.margin;
  const avgMargin = totalGames > 0 ? totalMargin / totalGames : 0;

  const winStreak = input.won ? leo.winStreak + 1 : 0;
  const winRate = totalGames > 0 ? wins / totalGames : 0;

  const nextLeo: LeoState = {
    ...leo,
    wins,
    losses,
    totalGames,
    winRate,
    avgMargin,
    winStreak,
    gamesThisWeek: leo.gamesThisWeek + 1,
    lastUpdated: new Date().toISOString(),
  };

  return {
    ...nextLeo,
    score: calculateLeoScore(nextLeo),
  };
}

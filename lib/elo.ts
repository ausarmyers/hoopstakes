/**
 * HoopStakes ELO System
 * 
 * Rules:
 * - Baseline ELO: 1200
 * - K-factor: 32 (first 30 games), then 16
 * - Only applies to Hoopster and Elite tiers
 * - Matchmaking tolerance: ±200 (Hoopster), ±100 (Elite)
 */

export interface ELOResult {
  newELO: number;
  eloChange: number;
  expectedScore: number;
}

/**
 * Calculate expected win probability using ELO formula
 * @param playerELO - Player's current ELO
 * @param opponentELO - Opponent's current ELO
 * @returns Expected score (0-1, where 1 = 100% expected to win)
 */
export function calculateExpectedScore(
  playerELO: number,
  opponentELO: number
): number {
  return 1 / (1 + Math.pow(10, (opponentELO - playerELO) / 400));
}

/**
 * Determine K-factor based on games played
 * @param gamesPlayed - Total games the player has played
 * @returns K-factor (32 for first 30 games, then 16)
 */
export function getKFactor(gamesPlayed: number): number {
  return gamesPlayed < 30 ? 32 : 16;
}

/**
 * Calculate new ELO after a match
 * @param playerELO - Player's current ELO
 * @param opponentELO - Opponent's current ELO
 * @param gamesPlayed - Total games the player has played
 * @param won - Whether the player won (true) or lost (false)
 * @returns ELO result with new ELO, change, and expected score
 */
export function calculateNewELO(
  playerELO: number,
  opponentELO: number,
  gamesPlayed: number,
  won: boolean
): ELOResult {
  const K = getKFactor(gamesPlayed);
  const expectedScore = calculateExpectedScore(playerELO, opponentELO);
  const actualScore = won ? 1 : 0;

  const eloChange = Math.round(K * (actualScore - expectedScore));
  const newELO = Math.max(100, playerELO + eloChange); // Floor at 100

  return {
    newELO,
    eloChange,
    expectedScore,
  };
}

/**
 * Check if two players are within matchmaking tolerance
 * @param player1ELO - First player's ELO
 * @param player2ELO - Second player's ELO
 * @param tier - Tier level ('hoopster' or 'elite')
 * @returns True if players can be matched
 */
export function canMatch(
  player1ELO: number,
  player2ELO: number,
  tier: 'hoopster' | 'elite'
): boolean {
  const tolerance = tier === 'elite' ? 100 : 200;
  const diff = Math.abs(player1ELO - player2ELO);
  return diff <= tolerance;
}

/**
 * Get ELO display string for UI
 * @param elo - Current ELO
 * @param tier - User tier
 * @param gamesPlayed - Total games played (for volatility)
 * @returns Formatted string (e.g., "1420 ± 50" for Hoopster, "1420 (±32)" for Elite)
 */
export function formatELO(
  elo: number,
  tier: 'Rookie' | 'Hoopster' | 'Elite',
  gamesPlayed: number
): string {
  if (tier === 'Rookie') {
    return 'N/A'; // Rookies don't have ELO
  }

  // Volatility decreases with more games
  const volatility = gamesPlayed < 10 ? 50 : gamesPlayed < 30 ? 30 : 20;

  if (tier === 'Hoopster') {
    return `${elo} ± ${volatility}`;
  }

  // Elite shows full detail
  return `${elo} (±${volatility})`;
}

/**
 * Get matchmaking priority queue position
 * @param elo - Current ELO
 * @param tier - User tier
 * @returns Priority level (higher = higher priority)
 */
export function getMatchmakingPriority(
  elo: number,
  tier: 'Rookie' | 'Hoopster' | 'Elite'
): number {
  if (tier === 'Rookie') return 0;
  if (tier === 'Hoopster') return 1;
  // Elite gets priority based on ELO (top 20% get extra boost)
  return elo >= 1500 ? 3 : 2;
}

/**
 * Calculate ELO rank percentile
 * @param elo - Current ELO
 * @returns Percentile (0-100, where 100 = top 1%)
 */
export function getELOPercentile(elo: number): number {
  // Approximate percentile based on normal distribution
  // Mean: 1200, StdDev: 200
  const mean = 1200;
  const stdDev = 200;
  const z = (elo - mean) / stdDev;

  // Simplified percentile approximation
  if (z <= -2) return 2.5;
  if (z <= -1) return 16;
  if (z <= 0) return 50;
  if (z <= 1) return 84;
  if (z <= 2) return 97.5;
  return 99;
}

/**
 * Get skill rank name based on ELO
 * @param elo - Current ELO
 * @returns Rank name (Bronze, Silver, Gold, Platinum, Diamond, Master)
 */
export function getSkillRank(elo: number): string {
  if (elo < 1000) return 'Bronze';
  if (elo < 1200) return 'Silver';
  if (elo < 1400) return 'Gold';
  if (elo < 1600) return 'Platinum';
  if (elo < 1800) return 'Diamond';
  return 'Master';
}

// Initial ELO for new paid users
export const INITIAL_ELO = 1200;

// ELO constants
export const ELO_CONSTANTS = {
  INITIAL: 1200,
  MIN: 100,
  K_FACTOR_HIGH: 32, // First 30 games
  K_FACTOR_LOW: 16, // After 30 games
  THRESHOLD_GAMES: 30,
  HOOPSTER_TOLERANCE: 200,
  ELITE_TOLERANCE: 100,
  TOP_PERCENTILE_THRESHOLD: 1500, // Top 20% eligibility for Elite leaderboard
} as const;

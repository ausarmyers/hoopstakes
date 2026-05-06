import { httpsCallable } from 'firebase/functions';
import { functions } from './firebase';

export async function submitMatchResult(payload: {
  opponentUid: string;
  myScore: number;
  opponentScore: number;
}) {
  const callable = httpsCallable(functions, 'submitMatchResult');
  const result = await callable(payload);
  return result.data as { matchId: string; status: string };
}

export async function confirmMatchResult(matchId: string) {
  const callable = httpsCallable(functions, 'confirmMatchResult');
  await callable({ matchId });
}

export async function openMatchDispute(matchId: string, reason: string) {
  const callable = httpsCallable(functions, 'openMatchDispute');
  await callable({ matchId, reason });
}

export async function requestCashout(amount: number) {
  const callable = httpsCallable(functions, 'requestCashout');
  await callable({ amount });
}

export async function ingestAnalyticsEvent(eventName: string, payload: Record<string, unknown>) {
  const callable = httpsCallable(functions, 'ingestAnalyticsEvent');
  await callable({ eventName, payload });
}

export async function getAdminKpis() {
  const callable = httpsCallable(functions, 'getAdminKpis');
  const result = await callable({});
  return result.data as {
    kpis: {
      matchSubmitted: number;
      disputesOpened: number;
      trustRate: number;
      videoViews: number;
      tournamentEntry: number;
    };
  };
}

export async function getLeoBreakdownDetails(targetUid?: string) {
  const callable = httpsCallable(functions, 'getLeoBreakdown');
  const result = await callable(targetUid ? { targetUid } : {});
  return result.data as {
    player: {
      uid: string;
      name: string;
      tier: string;
      positionAbbr: string;
      leoScore: number;
      hooperTier: string;
    };
    metrics: {
      winRate: number;
      avgMargin: number;
      winStreak: number;
      gamesThisWeek: number;
    };
    breakdown: {
      winRatePoints: number;
      marginPoints: number;
      streakPoints: number;
      activityPoints: number;
      total: number;
    };
    formula: string;
  };
}

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
// TODO: Migrate functions to 2nd Gen (gcfv2) + Node 22 post-launch.
// Migration checklist:
// - Update `functions/package.json` `engines.node` => "22"
// - Replace or add `.runWith({ platform: 'gcfv2' })` where appropriate
// - Verify `firebase-functions` major version and update code as needed
// - Test locally and deploy to a staging project first
// - Update CI/CD and IAM/service account permissions for Artifact Registry
import Stripe from 'stripe';

admin.initializeApp();
const db = admin.firestore();

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: '2024-06-20',
    })
  : null;

type Tier = 'rookie' | 'hoopster' | 'elite';

const PRICE_IDS: Record<Exclude<Tier, 'rookie'>, string> = {
  hoopster: process.env.STRIPE_PRICE_HOOPSTER || '',
  elite: process.env.STRIPE_PRICE_ELITE || '',
};

function requireAuth(context: functions.https.CallableContext): string {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication is required.');
  }
  return context.auth.uid;
}

function cashoutMinimumForTier(tier: Tier): number {
  if (tier === 'hoopster') return 10;
  if (tier === 'elite') return 5;
  return Number.POSITIVE_INFINITY;
}

const ACTIVE_CITIES = ['San Diego', 'Miami', 'Broward'] as const;

function isActiveCity(city: string): boolean {
  return ACTIVE_CITIES.includes(city as any);
}

function normalizeMargin(margin: number): number {
  return Math.max(0, Math.min(margin, 8));
}

function hooperTierFromLeo(score: number): string {
  if (score >= 90) return 'Legend Circuit';
  if (score >= 80) return 'Elite Run';
  if (score >= 70) return 'Gym Proven';
  if (score >= 60) return 'Street Certified';
  return 'Rising Hooper';
}

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const createStripeCheckout = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);

  if (!stripe) {
    throw new functions.https.HttpsError('failed-precondition', 'Stripe is not configured.');
  }

  const tier = String(data?.tier || '').toLowerCase() as Tier;
  if (tier !== 'hoopster' && tier !== 'elite') {
    throw new functions.https.HttpsError('invalid-argument', 'tier must be hoopster or elite.');
  }

  const price = PRICE_IDS[tier];
  if (!price) {
    throw new functions.https.HttpsError('failed-precondition', `Missing Stripe price id for ${tier}.`);
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price, quantity: 1 }],
    success_url: data?.successUrl || 'https://hoopstakes.app/success',
    cancel_url: data?.cancelUrl || 'https://hoopstakes.app/cancel',
    metadata: {
      uid,
      tier,
    },
  });

  return { checkoutUrl: session.url, sessionId: session.id };
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  if (!stripe || !stripeWebhookSecret) {
    res.status(500).send('Stripe webhook not configured.');
    return;
  }

  const signature = req.header('stripe-signature');
  if (!signature) {
    res.status(400).send('Missing stripe-signature header.');
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, signature, stripeWebhookSecret);
  } catch (error) {
    functions.logger.error('Webhook signature verification failed', error);
    res.status(400).send('Invalid signature.');
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.uid;
      const tier = (session.metadata?.tier || 'rookie') as Tier;

      if (uid && (tier === 'hoopster' || tier === 'elite')) {
        const userRef = db.collection('users').doc(uid);
        await db.runTransaction(async (tx) => {
          const snap = await tx.get(userRef);
          const current = snap.data() || {};
          const alreadyGranted = Boolean(current.subscription?.gameplayGrantedOnce);
          const oneTimeGrant = tier === 'elite' ? 10 : 5;

          tx.set(
            userRef,
            {
              tier,
              gameplayBalance: alreadyGranted
                ? Number(current.gameplayBalance || 0)
                : oneTimeGrant,
              subscription: {
                stripeId: session.subscription,
                status: 'active',
                gameplayGrantedOnce: alreadyGranted || true,
                nextBilling: null,
              },
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        });
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object as Stripe.Subscription;
      const users = await db
        .collection('users')
        .where('subscription.stripeId', '==', sub.id)
        .limit(1)
        .get();

      if (!users.empty) {
        await users.docs[0].ref.set(
          {
            tier: 'rookie',
            subscription: {
              stripeId: sub.id,
              status: 'canceled',
              gameplayGrantedOnce: true,
              nextBilling: null,
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    }

    res.json({ received: true });
  } catch (error) {
    functions.logger.error('stripeWebhook failed', error);
    res.status(500).send('Webhook processing failed');
  }
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const requestCashout = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);

  const amount = Number(data?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'amount must be a positive number');
  }

  const authUser = await admin.auth().getUser(uid);
  if (!authUser.emailVerified) {
    throw new functions.https.HttpsError('failed-precondition', 'Email verification required before cashout');
  }

  const userRef = db.collection('users').doc(uid);
  const previousCashouts = await db
    .collection('transactions')
    .where('userId', '==', uid)
    .where('type', '==', 'cashout')
    .get();
  const cashoutCount = previousCashouts.size;
  const videoProofRequired = cashoutCount < 3;

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const user = snap.data() as any;
    const tier = String(user?.tier || 'rookie').toLowerCase() as Tier;
    const earnedBalance = Number(user?.earnedBalance || 0);
    const min = cashoutMinimumForTier(tier);

    if (tier === 'rookie') {
      throw new functions.https.HttpsError('failed-precondition', 'Rookie tier cannot cash out');
    }

    if (amount < min) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        `Minimum cashout for ${tier} is $${min.toFixed(2)}`
      );
    }

    if (amount > earnedBalance) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient earned balance');
    }

    const postCashout = earnedBalance - amount;
    if (postCashout < 1) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'You must retain at least $1 after cashout'
      );
    }

    tx.set(
      userRef,
      {
        earnedBalance: postCashout,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    const txRef = db.collection('transactions').doc();
    tx.set(txRef, {
      userId: uid,
      type: 'cashout',
      amount,
      preCashoutEarnedBalance: earnedBalance,
      postCashoutEarnedBalance: postCashout,
      tier,
      status: 'pending_review',
      videoProofRequired,
      cashoutCount: cashoutCount + 1,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { ok: true, videoProofRequired, cashoutCount: cashoutCount + 1 };
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const openMatchDispute = functions.https.onCall(async (data, context) => {
  const reporterId = requireAuth(context);
  const reportedUserId = String(data?.reportedUserId || '').trim();
  const matchId = String(data?.matchId || '').trim();
  const reason = String(data?.reason || '').trim();

  if (!reportedUserId || !matchId || !reason) {
    throw new functions.https.HttpsError('invalid-argument', 'reportedUserId, matchId, and reason are required');
  }

  await db.collection('match_reports').add({
    reporterId,
    reportedUserId,
    matchId,
    reason,
    status: 'pending',
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const reportMatch = openMatchDispute;

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const sendVerificationReminder = functions.pubsub.schedule('every 1 hours').onRun(async () => {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 1000 * 60 * 60 * 24);
  const usersSnap = await db
    .collection('users')
    .where('earnedBalance', '>', 5)
    .where('emailVerified', '==', false)
    .where('verificationReminderQueuedAt', '<=', cutoff)
    .get();

  if (usersSnap.empty) return null;

  const batch = db.batch();

  for (const doc of usersSnap.docs) {
    const user = doc.data() as any;
    batch.set(
      db.collection('email_reminders').doc(),
      {
        userId: doc.id,
        email: String(user?.email || ''),
        type: 'unverified_user',
        earnedBalance: Number(user?.earnedBalance || 0),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: false }
    );

    batch.set(
      doc.ref,
      { verificationReminderQueuedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  await batch.commit();
  return null;
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const submitMatchResult = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);

  const opponentUid = String(data?.opponentUid || '');
  const myScore = Number(data?.myScore);
  const opponentScore = Number(data?.opponentScore);
  const courtId = String(data?.courtId || '').trim();
  const courtCity = String(data?.courtCity || '').trim();
  const courtHasAdmin = Boolean(data?.courtHasAdmin);
  const courtQrCode = String(data?.courtQrCode || '').trim();

  if (!opponentUid) {
    throw new functions.https.HttpsError('invalid-argument', 'opponentUid is required');
  }

  if (!Number.isFinite(myScore) || !Number.isFinite(opponentScore) || myScore <= opponentScore) {
    throw new functions.https.HttpsError('invalid-argument', 'Winner score must be higher than opponent score');
  }

  if (!courtId || !courtCity || !isActiveCity(courtCity)) {
    throw new functions.https.HttpsError('failed-precondition', 'Matches can only be submitted from active launch cities');
  }

  const margin = myScore - opponentScore;
  const matchRef = db.collection('matches').doc();

  await matchRef.set({
    createdBy: uid,
    opponentUid,
    myScore,
    opponentScore,
    margin,
    courtId,
    courtCity,
    courtHasAdmin,
    courtQrCode,
    normalizedMargin: normalizeMargin(margin),
    status: 'pending_confirmation',
    proofRequired: true,
    videoProofPrompted: false,
    confirmations: {
      [uid]: true,
      [opponentUid]: false,
    },
    dispute: {
      open: false,
      reason: null,
      openedBy: null,
      adminResolution: null,
    },
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { matchId: matchRef.id, status: 'pending_confirmation' };
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const confirmMatchResult = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const matchId = String(data?.matchId || '');
  const adminVerified = Boolean(data?.adminVerified);
  const adminQrCode = String(data?.adminQrCode || '').trim();

  if (!matchId) {
    throw new functions.https.HttpsError('invalid-argument', 'matchId is required');
  }

  const ref = db.collection('matches').doc(matchId);

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'match not found');
    }

    const match = snap.data() as any;
    if (match.status !== 'pending_confirmation') {
      throw new functions.https.HttpsError('failed-precondition', 'match is not pending confirmation');
    }

    if (adminVerified) {
      const adminSnap = await db.collection('admins').doc(uid).get();
      if (!adminSnap.exists) {
        throw new functions.https.HttpsError('permission-denied', 'Admin role required');
      }
      if (!adminQrCode || adminQrCode !== String(match.courtQrCode || '')) {
        throw new functions.https.HttpsError('failed-precondition', 'Valid gym admin QR code required');
      }
    }

    const confirmations = {
      ...(match.confirmations || {}),
      [uid]: true,
    };

    const allConfirmed = Object.values(confirmations).every(Boolean);
    const verifiedByAdmin = adminVerified ? uid : match.verifiedByAdmin || null;

    tx.set(
      ref,
      {
        confirmations,
        verifiedByAdmin,
        status: allConfirmed || adminVerified ? 'confirmed' : 'pending_confirmation',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  return { ok: true };
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const autoResolveExpiredDisputes = functions.pubsub.schedule('every 1 hours').onRun(async () => {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 1000 * 60 * 60 * 24);
  const snapshot = await db
    .collection('matches')
    .where('status', '==', 'pending_confirmation')
    .where('createdAt', '<=', cutoff)
    .get();

  if (snapshot.empty) return null;

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.set(
      doc.ref,
      {
        status: 'confirmed',
        autoResolvedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  await batch.commit();
  return null;
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const queueEmailVerificationReminders = functions.pubsub.schedule('every 6 hours').onRun(async () => {
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - 1000 * 60 * 60 * 24);
  const usersSnap = await db
    .collection('users')
    .where('earnedBalance', '>', 5)
    .where('emailVerified', '==', false)
    .where('verificationReminderQueuedAt', '<=', cutoff)
    .get();

  if (usersSnap.empty) return null;

  const batch = db.batch();

  for (const doc of usersSnap.docs) {
    const user = doc.data() as any;
    const email = String(user?.email || '').trim();
    if (!email) continue;

    const verificationLink = await admin.auth().generateEmailVerificationLink(email, {
      url: 'https://hoopstakes.com/verify-email',
    });

    const reminderRef = db.collection('email_reminders').doc();
    batch.set(reminderRef, {
      userId: doc.id,
      email,
      subject: 'Verify your email to cash out on HoopStakes',
      body: 'You have earned balance available. Verify your email to unlock cashouts.',
      verificationLink,
      status: 'queued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.set(
      doc.ref,
      {
        verificationReminderQueuedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
  return null;
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const ingestAnalyticsEvent = functions.https.onCall(async (data, context) => {
  const uid = context.auth?.uid || null;
  const eventName = String(data?.eventName || '').trim();
  const payload = typeof data?.payload === 'object' && data?.payload !== null ? data.payload : {};

  if (!eventName) {
    throw new functions.https.HttpsError('invalid-argument', 'eventName is required');
  }

  await db.collection('analytics_events').add({
    uid,
    eventName,
    payload,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true };
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const getAdminKpis = functions.https.onCall(async (_data, context) => {
  const uid = requireAuth(context);
  const adminSnap = await db.collection('admins').doc(uid).get();
  if (!adminSnap.exists) {
    throw new functions.https.HttpsError('permission-denied', 'Admin role required');
  }

  const eventsSnap = await db
    .collection('analytics_events')
    .where('createdAt', '>=', admin.firestore.Timestamp.fromDate(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)))
    .get();

  const events = eventsSnap.docs.map((doc) => doc.data());

  const count = (name: string) => events.filter((e) => e.eventName === name).length;
  const matchSubmitted = count('match_submitted');
  const disputesOpened = count('match_dispute_opened');
  const videoViews = count('video_proof_viewed');
  const tournamentEntry = count('tournament_entry');

  return {
    kpis: {
      matchSubmitted,
      disputesOpened,
      trustRate: matchSubmitted > 0 ? Number((((matchSubmitted - disputesOpened) / matchSubmitted) * 100).toFixed(1)) : 100,
      videoViews,
      tournamentEntry,
    },
  };
});

// TODO: Migrate to 2nd Gen + Node 22 post-launch
export const getLeoBreakdown = functions.https.onCall(async (data, context) => {
  const uid = requireAuth(context);
  const targetUid = String(data?.targetUid || uid);

  if (targetUid !== uid) {
    const adminSnap = await db.collection('admins').doc(uid).get();
    if (!adminSnap.exists) {
      throw new functions.https.HttpsError('permission-denied', 'Only admins can request another player breakdown');
    }
  }

  const userSnap = await db.collection('users').doc(targetUid).get();
  if (!userSnap.exists) {
    throw new functions.https.HttpsError('not-found', 'Player not found');
  }

  const user = userSnap.data() as any;
  const leo = user?.leo || {};
  const totalGames = Number(leo.totalGames || 0);

  const winRate = Number(leo.winRate || 0);
  const avgMargin = Number(leo.avgMargin || 0);
  const winStreak = Number(leo.winStreak || 0);
  const gamesThisWeek = Number(leo.gamesThisWeek || 0);

  const winRatePoints = winRate * 70;
  const marginPoints = normalizeMargin(avgMargin) * 20;
  const streakPoints = winStreak * 5;
  const activityPoints = gamesThisWeek;
  const total = Math.round(winRatePoints + marginPoints + streakPoints + activityPoints);
  const displayLeoScore = totalGames < 3 ? Math.round(total * 0.7) : total;

  return {
    player: {
      uid: targetUid,
      name: String(user?.name || 'Unknown Hooper'),
      tier: String(user?.tier || 'Rookie'),
      positionAbbr: String(user?.positionAbbr || 'G'),
      leoScore: total,
      displayLeoScore,
      hooperTier: hooperTierFromLeo(displayLeoScore),
      isCalibrating: totalGames < 3,
    },
    metrics: {
      winRate,
      avgMargin,
      winStreak,
      gamesThisWeek,
      totalGames,
    },
    breakdown: {
      winRatePoints,
      marginPoints,
      streakPoints,
      activityPoints,
      total,
    },
    formula: totalGames < 3
      ? 'Calibrating... play 3 games for a fully stable LEO.'
      : 'LEO = (Win% x 70) + (Avg Margin x 20) + (Win Streak x 5) + (Games This Week x 1)',
  };
});

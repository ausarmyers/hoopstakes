# 🏀 HoopStakes: Master Business & Technical Specification

## 🎯 Core Business Model

- **Freemium**: 3 tiers — Rookie (free), Hoopster ($5/mo), Elite ($10/mo)
- **Monetization**: 100% subscription + B2B gym partnerships
- **No ads anywhere**
- **Only paid users earn Stakes** (cash value); free users earn XP only

---

## 🔐 User Tiers & Access Rules

| Feature | Rookie | Hoopster | Elite |
|---------|--------|----------|-------|
| **Gameplay Balance** | ❌ | ✅ $5 (one-time) | ✅ $10 (one-time) |
| **Stakes per Win** | ❌ (XP only) | ✅ $0.25 | ✅ $0.25 / $0.50 / $1.00 |
| **Earned Balance UI** | ❌ Hidden | ✅ Visible | ✅ Visible |
| **Cashout** | ❌ | ✅ @ $10 min | ✅ @ $5 min |
| **Post-Cashout Rule** | — | Must leave $1 | Must leave $1 |
| **Matchmaking Visibility** | ❌ Hidden | ✅ See active hoopers | ✅ + Priority matching |
| **Skill Ranks** | ✅ Bronze–Diamond (XP) | ✅ + win % | ✅ + Elite badge |
| **Leaderboards** | ✅ XP-only | ✅ Cash + XP | ✅ + Elite-only cash LB |
| **Tournaments** | ❌ | ✅ Free monthly | ✅ Exclusive high-stakes |
| **Redemptions** | ❌ | ✅ Snacks, credits | ✅ + merch discounts |
| **Social Profile** | Basic | ✅ Win highlights | ✅ Verified payout badge |

💡 **All users can check in and play** — but only paid tiers earn Stakes

---

## ⚖️ Non-Negotiable Business Rules (Enforce Backend)

1. **Gameplay Balance** is granted once on first subscription — **never replenished**
2. **Stakes are mandatory** for paid users — no "play for fun" mode
3. **Free users cannot cash out** — XP only
4. **Cashouts require $1 minimum retained balance**
5. **Gym QR codes use rotating tokens** to prevent screenshot reuse
6. **Offline wins must queue locally** and sync when online

---

## 🧠 ELO Skill System (For Paid Tiers Only)

### Rookie
- **No ELO** — uses XP ranks only

### Hoopster/Elite
- **Full ELO with dynamic matchmaking**
- **Baseline**: 1200
- **Formula**: `NewELO = OldELO + K × (Actual - Expected)`
  - `K = 32` (first 30 games), then `16`
  - `Expected = 1 / (1 + 10^((OpponentELO - YourELO)/400))`

### Matchmaking
- **Hoopster**: ±200 ELO
- **Elite**: ±100 ELO + priority queue

### UI Display
- **Hoopster**: `"1420 ± 50"`
- **Elite**: Full ELO + volatility metric

### Leaderboards
- **XP**: All tiers
- **ELO**: Hoopster+
- **Elite Cash LB**: Top 20% ELO only

---

## 📱 Frontend (React Native + Expo)

### State Management
Use **Zustand** or Context:
```tsx
user.tier = 'rookie' | 'hoopster' | 'elite'
```

### Feature Gating
Wrap premium features:
```tsx
<RequireTier minTier="hoopster">
  <CashoutButton />
</RequireTier>
```

### UI Rules
- **Hide Earned Balance UI** for rookie
- **Show ELO diff** before match if both users are paid

---

## ☁️ Backend (Firebase + Stripe)

### User Document Schema
```javascript
{
  tier: "hoopster",
  gameplayBalance: 5.00,
  earnedBalance: 12.75,
  elo: 1350,
  gamesPlayed: 12,
  xp: 2450,
  subscription: {
    stripeId: "sub_...",
    status: "active",
    nextBilling: "2026-02-18"
  }
}
```

### Firestore Security Rules
- **Block cashout** if `earnedBalance < 10` (Hoopster) or `< 5` (Elite)
- **Enforce $1 post-cashout rule** at API level
- **Allow ELO updates** only via trusted functions

### Stripe Webhooks
- **On `invoice.paid`**: set tier, grant gameplay balance
- **On `customer.subscription.deleted`**: downgrade to rookie, hide cashout

---

## 👨‍💼 Admin Dashboard Requirements

### User Management
- View/edit tier, balance, ELO
- Impersonate users

### Financial Controls
- Cashout history
- Fraud detection (e.g., 10 gyms/hour)

### Content Control
- Create tournaments
- Manage redemptions
- Toggle feature flags

### Analytics
- Track **Rookie → Hoopster → Elite** conversion
- Gym engagement by tier

---

## 🛠️ Edge Cases to Handle

| Scenario | Solution |
|----------|----------|
| **Downgrade** | Freeze gameplay balance, revert UI to Rookie |
| **Expired Subscription** | Immediately hide cashout/redemptions |
| **Match Dispute** | Require mutual confirmation or gym admin verification |
| **Offline Mode** | Queue wins, validate on reconnect |

---

## ✅ Why This Works

- **Rookie**: Feels included, sees clear upgrade path
- **Hoopster**: Fast value ($10 ≈ 40 wins)
- **Elite**: Status, control, exclusivity → drives retention & upgrades
- **You**: High-margin, ad-free, scalable model

---

## 💬 Implementation Checklist

### Frontend
- [x] `<RequireTier>` component created
- [x] Zustand store updated with ELO & subscription schema
- [x] ELO calculation functions implemented
- [ ] Update all screens to use `<RequireTier>` wrapper
- [ ] Hide Earned Balance for Rookie tier
- [ ] Show ELO in matchmaking UI for paid tiers

### Backend
- [ ] Firebase user schema matches spec
- [ ] Firestore security rules enforce cashout minimums
- [ ] Stripe webhook handlers for subscription events
- [ ] ELO update Cloud Function (trusted only)
- [ ] Gym QR token rotation system
- [ ] Offline win queue & sync logic

### Admin Dashboard
- [ ] User management panel
- [ ] Financial controls & cashout history
- [ ] Tournament creation interface
- [ ] Analytics dashboard with conversion tracking

---

## 🔗 Related Files

- **RequireTier Component**: `lib/RequireTier.tsx`
- **ELO System**: `lib/elo.ts`
- **Store**: `lib/store.ts`
- **User Schema**: Firebase Firestore `/users/{uid}`

---

**Last Updated**: January 17, 2026  
**Version**: 1.0.0

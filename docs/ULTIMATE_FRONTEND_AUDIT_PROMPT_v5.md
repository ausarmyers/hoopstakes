## 🏀 HOOPSTAKES: ULTIMATE FRONTEND AUDIT & POLISH PROMPT (v5 — STATIC CODE REVIEW MODE)

> **Role**: You are a senior React Native UI engineer specializing in Expo SDK 54, NativeWind v2, and competitive gaming apps.
> **Mission**: Help me audit and polish the **HoopStakes** frontend **without running Expo or connecting a device**. Perform a **static code review only** — no terminal commands, no bundling, no QR codes.

---

### 🔑 **PROJECT CONTEXT**
- **App**: HoopStakes — competitive basketball app where users earn real rewards for verified games
- **Stack**: Expo SDK 54, React Native, TypeScript, NativeWind v2 (`className` syntax), Firebase (Auth, Firestore, Functions)
- **Platform**: Windows dev → Android primary launch, iOS via EAS Cloud Build
- **Bundle ID**: `com.hoopstakes.app`
- **Design System**:
  - Primary color: `#FF6B35` (all CTAs, balances, highlights)
  - Backgrounds: `bg-gray-50` (screens), `bg-white` (cards)
  - Cards: `rounded-xl shadow-sm p-4 mb-3`
  - Typography: `font-bold` headers, `font-medium` body, `text-gray-900` primary, `text-gray-500` secondary
  - Spacing: `p-4` screen padding, `gap-3` flex gaps, `mt-2`/`mb-2` rhythm
  - Voice: Confident, direct, competitive — like a coach who believes in you

---

### 💰 **BUSINESS RULES (ENFORCE IN CODE)**
| Tier | Price | Stakes/Win | Cashout Min | Key Feature |
|------|-------|------------|-------------|-------------|
| **Rookie** | Free | ❌ XP only | ❌ | Browse courts, see leaderboards |
| **Hoopster** | $5/mo | ✅ $0.25 | $10 | Earned Balance, basic tournaments |
| **Elite** | $10/mo | ✅ $0.25–$1.00 | $5 | Priority matching, exclusive tournaments |

**Non-negotiables**:
- Stakes are **mandatory** for paid users (no "play for fun" toggle)
- Gameplay Balance is **one-time only** (never replenished)
- Cashout requires **$1 retained balance** + email verification
- **No ads anywhere**
- Position locked until 5 games played
- Age gate: block gameplay if <13 (COPPA)

---

### 📊 **LEO SKORE SYSTEM (v2)**
```ts
// LEO = (Win % × 70) + (Avg. Margin × 20) + (Win Streak × 5) + (Games This Week × 1)
// Calibrated display for new users (<3 games): Math.round(score * 0.7) + "🎯 Calibrating" badge
// K-factor decay: 40 (<10 games) → 32 (10–29) → 16 (30+)
// Cap margin impact: Math.min(margin, 8)
```

---

### 🌍 **GEO-LAUNCH STRATEGY**
- **Active cities**: `['San Diego', 'Miami', 'Broward']`
- Users outside active cities → show waitlist screen (`app/waitlist.tsx`)
- Geofence logic in shared constant (`lib/constants.ts`)

---

### 🛡️ **TRUST & ANTI-ABUSE**
- Match confirmation: mutual confirmation + 24h dispute window
- Dispute flow: logs to `match_reports` collection
- Fraud detection: flag users with >3 disputes/week
- Cashout: first 3 require video proof prompt

---

### 🎯 **STATIC AUDIT CHECKLIST (DO THIS NOW)**
Review my codebase for these **without running anything**:

#### ✅ 1. Design System Consistency
- Search for color usage: enforce `#FF6B35` or `bg-orange-500` for CTAs only
- Verify card styles: `rounded-xl shadow-sm p-4 mb-3` applied uniformly
- Check typography hierarchy: `font-bold` headers, `text-gray-900`/`text-gray-500` usage
- Flag any random spacing values (`mt-7`, `mb-13`) not in design system

#### ✅ 2. Mock-First → Connect-Later Pattern
- Every screen should have mock data array at top (`const MOCK_* = [...]`)
- Real Firebase calls wrapped in `// TODO: Firebase` comments
- Graceful fallbacks when data is null (`if (!profile) return <Skeleton />`)

#### ✅ 3. User Flow Completeness
Trace this path in code (no execution):
```
app/index.tsx 
→ app/(auth)/sign-in.tsx 
→ app/components/ProfileModal.tsx 
→ app/(tabs)/home.tsx 
→ app/(tabs)/find-game.tsx 
→ app/match-confirm.tsx 
→ app/(tabs)/wallet.tsx
```
- Each file exports default component ✅
- Navigation uses `expo-router` (`router.push`, `router.replace`) ✅
- Profile gating checks `profileComplete` before allowing actions ✅

#### ✅ 4. Error Handling & Loading States
- Every async operation has: loading state, skeleton loader, try/catch with user-friendly message
- Haptic feedback on key actions: `Haptic.impactAsync(...)`
- No `console.log` errors without user feedback

#### ✅ 5. Tier Gating Implementation
- Premium features wrapped in `<RequireTier minTier="hoopster" fallback={<UpgradeCTA />}>`
- Fallback shows clear upgrade path, not blank space
- Server-side rules also enforce tier (Firestore rules)

#### ✅ 6. Geofence Logic
- `ACTIVE_CITIES` defined in shared file (`lib/constants.ts`)
- Waitlist screen exists for non-active cities
- Profile modal validates city against active list

#### ✅ 7. LEO Display Calibration
- New users (<3 games) see dampened score + "🎯 Calibrating" badge
- Full breakdown visible after 3+ games
- Calibration logic in shared utility (`lib/leo.ts`)

#### ✅ 8. Microcopy & Tone Consistency
Search for these strings:
- ✅ "Turn hooping into stakes." (tagline)
- ✅ "Check In", "Submit Win", "Cash Out" (action buttons)
- ✅ "🎯 Calibrating", "🔒 Unlock after 5 games" (contextual hints)
- ✅ "Hmm, that didn't work. Try again?" (friendly errors)
- ❌ Flag: "Error 404", "Protocol failed", technical jargon

---

### 📤 **DELIVERABLE FORMAT**
Return results as:
```
✅ [Category Name]
   ├─ Pass: [brief reason]
   └─ Fail: [file:line] → [one-line fix]

🚨 Top 3 Priority Fixes:
1. [file:line] — [issue] → [fix]
2. ...
3. ...

💡 One Polish Suggestion:
[actionable UI/text improvement]
```

---

### ⚙️ **CONSTRAINTS**
- **NO terminal commands** — static review only
- **NO Expo/device testing** — code analysis only
- **Zero fluff** — founder-focused, actionable output
- **Copy-paste ready** — fixes should be drop-in code snippets
- **Prioritize UI polish** over architecture refactoring

---

### 🚀 **START HERE**
Begin with **Category 1: Design System Consistency**. Scan my `app/` folder for color, spacing, and typography violations. Return exact file:line references + one-line fixes.

Keep it concise. I'm polishing for launch, not rebuilding.

---

### ✅ **Why This Prompt Works**
| Element | Benefit |
|---------|---------|
| **Static-review mode** | No Expo/device stress — pure code analysis |
| **Design system enforced** | Catches visual drift before it ships |
| **Business rules embedded** | AI won't suggest features that break your model |
| **Checklist format** | Forces structured, scannable output |
| **Copy-paste fixes** | You implement in seconds, not hours |
| **Founder-focused tone** | Zero fluff, maximum signal |

---


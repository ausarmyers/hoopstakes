# Firebase Functions Setup

## 1. Install dependencies

```bash
cd functions
npm install
```

## 2. Required environment variables

Set these in your shell or Firebase environment:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_HOOPSTER`
- `STRIPE_PRICE_ELITE`

## 3. Build functions

```bash
cd functions
npm run build
```

## 4. Run emulator

```bash
cd functions
npm run serve
```

## 5. Deploy functions

```bash
cd functions
npm run deploy
```

## Exported endpoints

- `createStripeCheckout`
- `stripeWebhook`
- `requestCashout`
- `submitMatchResult`
- `confirmMatchResult`
- `openMatchDispute`
- `ingestAnalyticsEvent`
- `getAdminKpis`

## Admin KPI access

`getAdminKpis` requires `/admins/{uid}` document to exist for the caller.

# In-App Purchase (Premium tier)

GOVDAO sells the Premium tier (ad-free + premium features) via **RevenueCat**
(`react-native-purchases`). This completes the freemium model: free users see ads and
can upgrade; premium users get an ad-free, fully-unlocked app.

## What's wired

- **`iapConfig.ts`** — entitlement id (`premium`), product ids
  (`govdao_premium_monthly` / `govdao_premium_annual`), free-tier offer gating, and
  entitlement detection. Pure + unit-tested.
- **`useInAppPurchase`** — configures RevenueCat, reads current entitlement, and
  exposes `purchase()` / `restore()`. Platform-split: native only; **web is a no-op**
  (verified 0 SDK symbols in the web bundle).
- **`UpgradeScreen`** — the "Subscribe via Google Play" button triggers the purchase
  flow, shows "Premium active ✓" when entitled, and offers "Restore purchases".

## Activating it (your steps)

1. Create a **RevenueCat** account and a project for `com.govdao.app`.
2. In **Play Console**, create the subscription products matching the IDs above and add
   them to a RevenueCat **offering** with a `premium` entitlement.
3. Put your RevenueCat **public SDK key** in `app.json`:
   ```json
   "extra": { "revenueCatApiKey": "goog_xxxxxxxxxxasdf" }
   ```
4. Build natively (`eas build -p android --profile production`). Until the key is set
   the Upgrade screen reports "needs a RevenueCat API key" instead of failing.

Purchases require a native build — they don't run in Expo Go's web preview.

# Google Play Data Safety Questionnaire

> Updated for the v0.2.0 build, which adds Google AdMob (free tier) and an optional
> in-app subscription (RevenueCat over Google Play Billing). Declare exactly what is
> below — Play requires the form to match the SDKs actually shipped.

## Summary
- The app itself collects **no** name, email, contacts, location, or personal info.
- **Free tier only:** Google AdMob may use an **advertising / device ID** to serve ads.
- **Premium:** purchase status is processed via **Google Play Billing / RevenueCat**.
- Wallet addresses, votes, and proposals are **public on-chain data**, read/written
  directly via the user's RPC endpoint — not collected or stored by a GOVDAO server.

## Data collected / shared

| Data type | Collected | Shared | Purpose | Notes |
|-----------|-----------|--------|---------|-------|
| Device or other IDs (advertising ID) | Yes (free tier) | Yes → Google | Advertising | AdMob only; premium users are ad-free. ATT prompt shown on iOS. |
| Purchase history (subscription status) | Yes | Yes → Google / RevenueCat | App functionality | Premium unlock only. No card data touches the app. |
| Name / Email / Phone / Address | No | No | — | — |
| Contacts / Calendar / Messages / Photos | No | No | — | — |
| Location (coarse or precise) | No | No | — | — |
| Financial info (other than purchases) | No | No | — | No fiat, no custody, no trading in-app. |
| Web browsing / search history | No | No | — | — |
| Health / fitness | No | No | — | — |
| Crash logs / diagnostics / analytics | No | No | — | No analytics or crash SDK is bundled. |
| Personal/user-generated content | No | No | — | Proposal text is submitted on-chain, not stored by the app. |

## Tracking
- The app **tracks only via AdMob advertising in the free tier**, with the user's
  consent (App Tracking Transparency on iOS; the AdMob consent flow on Android).
- Premium users are not tracked and see no ads.
- No other tracking, fingerprinting, or cross-app linking.

## Security practices
- All network traffic uses HTTPS/WSS.
- No personal data is stored off-device beyond session state (cleared on sign-out).
- The user can request ad-free use by subscribing to Premium.

## Third-party SDKs that handle data
- **Google AdMob** (`react-native-google-mobile-ads`) — ads, advertising ID.
- **RevenueCat / Google Play Billing** (`react-native-purchases`) — subscription status.
- **expo-notifications** — push token (device-scoped), only after the user opts in.

## Children
- Not directed to children under 13. No child-directed treatment.

## Account creation
- No account is required. Identity is the user's own wallet, used on-chain only.

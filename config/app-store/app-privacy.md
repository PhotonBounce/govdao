# App Store Privacy ("Nutrition Label") — GOVDAO

Answers for App Store Connect → App Privacy.

## Data used to track you
- **Identifiers → Device ID** — *only when AdMob is active in the free tier.* Used for
  third-party advertising (Google AdMob). Premium (ad-free) users: none.
  If you enable ads, declare: Identifiers (Device ID) → Used for Tracking, linked for
  Third-Party Advertising, and present the App Tracking Transparency prompt
  (`NSUserTrackingUsageDescription` is set).

## Data linked to you
- None collected by the app itself.

## Data not linked to you
- **Purchases** — subscription status via RevenueCat/App Store, used for App
  Functionality (unlocking Premium). Not used to track.
- **Crash / diagnostics** — none collected by the app (no analytics SDK bundled).

## On-chain data (not "collected" by the app)
Wallet addresses, votes, and proposals live on the public blockchain. The app reads
and writes them directly via your RPC endpoint; it does not store them on any server.

## Third parties
- **Google AdMob** (free tier ads) — subject to Google's privacy policy.
- **RevenueCat / App Store** (subscriptions).
- **Your RPC provider** (reads/writes chain state).

## Tracking
Only if ads are enabled, and only with the user's ATT consent. No other tracking.

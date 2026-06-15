# App Store Review Notes — GOVDAO

## What the app does
GOVDAO is a client for on-chain DAO governance. Users connect an Ethereum wallet to
vote on proposals, create proposals, manage a treasury, and run the proposal lifecycle
(queue/execute through a timelock). It reads and writes to smart contracts via an RPC
endpoint — there is no GOVDAO backend server.

## How to review without a wallet / chain
The app ships in **demo (fixture) mode** out of the box: every screen is populated with
realistic sample data and all flows are exercisable without connecting a wallet or a
live chain. No configuration is needed to evaluate the UI and features.

## Crypto / financial notes
- No fiat on-ramp, no in-app trading, no custody of funds. The app only reads chain
  state and submits user-signed transactions to the user's own contracts.
- Premium is a standard auto-renewing subscription via StoreKit/RevenueCat. It unlocks
  app features and removes ads; it is unrelated to any on-chain value.

## Ads & ATT
The free tier shows Google AdMob ads and presents the App Tracking Transparency prompt
(`NSUserTrackingUsageDescription`). Premium is ad-free.

## Permissions
- **Face ID** (`NSFaceIDUsageDescription`) — optional confirmation before signing
  on-chain actions; the app falls back gracefully if unavailable.
- **Notifications** — optional governance reminders; user-initiated.

## Demo credentials
None required — demo mode needs no login.

# Project Handoff

This document is the session-to-session handoff for GOVDAO. It lives in the repo so it survives ephemeral development environments. Update it whenever a milestone lands.

Last updated: 2026-06-10.

## What This Project Is

GOVDAO is an on-chain governance kernel (Solidity contracts) plus the operator-grade client layer needed to sell it as a product: a deployment-manifest format, Google Play release gating, and an Expo mobile shell in [apps/mobile](../apps/mobile).

- Protocol details: [PROTOCOL.md](PROTOCOL.md)
- Distribution strategy: [MOBILE_DISTRIBUTION.md](MOBILE_DISTRIBUTION.md)
- Monetization positioning: [COMMERCIALIZATION.md](COMMERCIALIZATION.md)

## Current State

### Contracts (complete for milestone 0)

`MemberRegistry`, `Governor`, `Timelock`, `Treasury`, `EmergencyGuardian` with equal-weight member voting, timelocked execution, treasury caps, and auto-expiring guardian pause powers. Tests in `test/GovDAO.test.ts`, deploy script in `scripts/deploy.ts`.

### Mobile app (in progress)

The Expo shell consumes a synced deployment manifest (`apps/mobile/src/data/app.manifest.json`) and renders all data through one pipeline:

```
manifest → resolveDashboardEndpoints → fetchDashboardPayload (fixture:// or https://)
        → normalize* (schema-tolerant) → MobileDashboardData
        → useMobileDashboardData → useMobileShellController → screens
```

The local manifest points module/governance APIs at `fixture://govdao`, so the app runs the full normalized feed path without a live backend. The `DataStatusCard` and data-mode pills surface whether the app is on preview, fixture, mixed, or live feeds.

Feeds currently wired: proposals, off-chain motions, treasury (snapshot + movements), guardian (status + events), workspace.

Views: Overview (release readiness), Proposals (on-chain feed + motions), Treasury & Safety (balances, caps, movements, guardian emergency status), Modules (companion workspace), Settings (release controls), plus a breadcrumbed detail stack for every record kind.

Member access: a manifest-driven sign-in flow (`sessionSource.ts` → `useSessionController` → `SessionCard`) offers every method from `wallet.supported` and `governance.offchain.auth`. The handshake currently settles against deterministic fixture signers (clearly labelled "FIXTURE SIGNER" in the UI) so the flow is testable offline; `requiresAuth` modules show a sign-in gate until a session is active. Swapping in real WalletConnect/passkey SDKs only needs to replace `connectSession`.

Web bundling works: `react-native-web`/`react-dom`/`@expo/metro-runtime` are installed, and `EXPO_OFFLINE=1 npx expo export --platform web --output-dir dist` (from `apps/mobile`) produces a static build. `EXPO_OFFLINE=1` matters in sandboxed environments because the Expo CLI otherwise blocks on its version-check API.

Store packaging is wired: branded icon/adaptive-icon/splash are generated reproducibly by `npm --prefix apps/mobile run generate:assets` (pure node, no image deps — regenerate instead of editing the PNGs), `app.json` carries the Android package/versionCode/empty-permissions config, `eas.json` defines internal (APK) and production (AAB) build profiles, and `scripts/validate-app-config.ts` keeps `app.json` in lockstep with the manifest as part of `release:google-play` and CI. Draft legal documents live in `docs/legal/` and the Play Console worksheet in `docs/PLAY_LISTING.md`.

### Store-submission checklist status

From the minimum feature list in [MOBILE_DISTRIBUTION.md](MOBILE_DISTRIBUTION.md):

| Feature | Status |
| --- | --- |
| Wallet / passkey sign-in | Partial — full sign-in/sign-out flow with session state and module auth gating, but the handshake uses fixture signers; real WalletConnect/passkey SDK integration pending |
| Proposal feed with metadata | Done (fixture/remote normalized feed) |
| Proposal detail with on-chain status + doc hash verification | Done — proposal detail carries an Integrity card with live `Governor.getProposalState` reads (graceful "chain offline" fallback) and keccak-256 document verification against the anchored hash, matching the contract's `metadataHash` scheme; keccak is implemented dependency-free and vector-tested |
| Vote casting + transaction confirmation | Partial — session-gated ballot on proposal detail with signing/pending/confirmed states and receipts, but settlement is a fixture transaction; on-chain `Governor.castVote` submission pending |
| Treasury transparency dashboard | Done as read-only feed-backed view (balances, caps, pause state, movements) |
| Guardian emergency status screen | Done as read-only feed-backed panel (state, threshold, signers, drills, events) |
| Support and legal disclosure pages | Done — Settings link-outs open privacy, terms, support site, and support email via `Linking.openURL` |
| Off-chain motions / drafts / delegated approvals | Partial — feed and detail only; no draft editing or approval actions |
| Non-DAO companion module | Done (workspace module + queue) |

## Suggested Next Milestones (in order)

1. **On-chain settlement** — replace the fixture paths with real integrations: `voteSource.ts#castVoteTransaction` → `Governor.castVote` via `chain.rpcUrl`, and `sessionSource.ts#connectSession` → WalletConnect/passkey SDKs. Controllers and UI stay as-is.
2. **CI is wired** — `.github/workflows/ci.yml` runs the contract suite, every mobile gate plus the web bundle export, and a deploy-and-read job (hardhat node → deploy → `mobile:check-chain` against the live contracts). Solc downloads are blocked in sandboxed dev environments, which is why that job lives in CI.
3. **Live endpoint promotion** — replace `fixture://govdao` overrides with real HTTPS services; the normalizers already tolerate alternate field names.
4. **Production manifest values** — RPC endpoint, deployed contract addresses, real support/privacy/terms URLs; `npm run release:google-play` enumerates exactly what is still placeholder-backed.

## Conventions To Keep

- Every new data surface goes through the manifest → endpoint resolution → normalizer pipeline with mock fallbacks in `mockState.ts` and a fixture payload in `mobileDataSource.ts`, so `mobile:check-data` can exercise it offline.
- Manifest schema changes touch five places: `apps/mobile/src/types.ts`, `config/mobile-app.manifest.example.json`, `scripts/export-app-manifest.ts` (interface + env defaults), `scripts/validate-google-play-release.ts`, then `npm run mobile:sync-manifest`.
- Feature gates come from the manifest (`features.*`, `governance.offchain.enabled`), never hardcoded.

## Validation Commands

- `npm run mobile:validate` — manifest drift + TypeScript surface
- `npm run mobile:check-data` — runs the dashboard loader against the local manifest; fails on preview-only data
- `npm run mobile:check-session` — exercises the access-option list and sign-in handshakes headlessly
- `npm run mobile:check-vote` — signs in, loads the proposal feed, and casts a fixture vote end-to-end
- `npm run mobile:check-chain` — verifies the on-chain snapshot degrades gracefully on placeholder config, or reads a live node when `CHAIN_RPC_URL`/`TREASURY_ADDRESS`/`MEMBER_REGISTRY_ADDRESS`/`EMERGENCY_GUARDIAN_ADDRESS` are set
- `npm run mobile:check-proposal` — keccak-256 test vectors, document verification for every feed proposal, tamper detection, and Governor state fallback (live read with `CHAIN_RPC_URL`/`GOVERNOR_ADDRESS`)
- `npm run release:google-play` — full release gate (mobile validate, manifest export, Play validation)
- `npm test` — Hardhat contract suite

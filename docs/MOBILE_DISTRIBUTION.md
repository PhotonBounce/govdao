# Mobile Distribution

## What We Are Actually Selling

The protocol itself is open infrastructure. The sellable product is the operator-grade client layer around it:

- mobile governance app for members, proposers, and guardians
- deployment configuration per customer, network, and DAO
- optional hosted services for indexing, search, notifications, and metadata pinning
- onboarding, security review, and support

## Google Play Or Similar Store Constraints

- The app must work as a real product without promising speculative returns.
- If the app sells subscriptions for hosted services, support, analytics, or notifications inside the mobile app, store billing rules may apply.
- The app should not position itself as an investment product.
- Wallet connection and proposal voting are product features; they are not, by themselves, a monetization strategy.

## Recommended Distribution Sequence

1. Ship a hosted web app first.
2. Wrap it as a React Native or Flutter client once the user flows stabilize.
3. Publish Android through Google Play or private enterprise distribution.
4. Offer white-label deployments for institutions that need custom branding and private indexing.

## Minimum App Features Before Store Submission

- sign in with wallet or passkey-linked wallet
- proposal feed with metadata retrieval
- proposal detail with on-chain status and off-chain document hash verification
- vote casting and transaction confirmation
- treasury transparency dashboard
- guardian emergency status screen
- customer support and legal disclosure pages
- off-chain meeting motions, drafts, and delegated approval flows when governance is configured as hybrid or off-chain
- at least one non-DAO companion module if the release is positioned as a broader organization workspace

## Integration Model

The mobile client should consume a deployment manifest with:

- chain information
- contract addresses
- enabled feature flags
- hosted service endpoints
- support and legal metadata
- governance mode and off-chain DAO service configuration
- bundled app-module metadata for companion product functions

The example manifest lives at [config/mobile-app.manifest.example.json](config/mobile-app.manifest.example.json).

For release gating in this repo:

- export a concrete manifest with `npm run export:manifest -- --output config/mobile-app.manifest.google-play.generated.json`
- validate Google Play readiness with `npm run validate:google-play -- --manifest config/mobile-app.manifest.google-play.generated.json`
- run mobile manifest drift and type safety checks with `npm run mobile:validate`
- run the combined gate with `npm run release:google-play`

The release gate now fails early if the mobile manifest is stale or the Expo TypeScript surface is broken, before it validates placeholder URLs, zero addresses, missing privacy-policy links, weak Play listing metadata, and other configuration that would block or weaken store submission.

There is now a starter Expo client in [apps/mobile](apps/mobile):

- it reads a local synced manifest file at [apps/mobile/src/data/app.manifest.json](apps/mobile/src/data/app.manifest.json)
- `npm run mobile:sync-manifest` merges the root example manifest into the mobile app while preserving local mobile overrides and printing a short sync summary
- `npm run mobile:check-manifest` verifies that the synced mobile manifest is current without rewriting it, which is useful for CI and release gates
- `npm run mobile:check-data` runs the dashboard loader against the local mobile manifest and fails if the app is still stuck on preview-only data
- `npm run mobile:typecheck` validates the mobile TypeScript surface
- `npm run mobile:start` launches the Expo development server once the mobile dependencies are installed
- the checked-in local mobile manifest uses `fixture://govdao` module endpoints so the normalized dashboard loader can be exercised without a live backend during local development

The manifest now also supports:

- `governance.mode` for `on-chain`, `off-chain`, or `hybrid`
- off-chain DAO APIs and auth methods for policy, draft, and vote workflows that do not settle directly on-chain
- `experiences.modules` so the mobile release can bundle other app functions like document rooms, support, payments, or analytics alongside governance
- `services.mobileFeeds.*Path` so teams can override proposal, motion, and workspace feed routes without changing the client

## Compliance Positioning

- Sell governance software and managed operations, not token speculation.
- Keep treasury execution on-chain; keep search and notifications explicitly optional.
- Be explicit that customer data services are replaceable and have a deprecation path.
- Avoid app copy that frames governance participation as yield, rewards, or passive income.
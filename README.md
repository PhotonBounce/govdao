# GOVDAO

GOVDAO is an on-chain governance kernel for organizations that need transparent proposals, voting, timelocked execution, treasury controls, and limited emergency pause powers.

The current repo contains the protocol contracts, deployment script, test suite, and the first app-distribution artifacts needed to ship a mobile or storefront-facing client.

It now also includes a first mobile shell in [apps/mobile](apps/mobile) that consumes the manifest model and renders a hybrid DAO plus companion-workspace release surface.

## Current Scope

- Solidity governance kernel with equal-weight member voting
- Timelock-enforced execution path
- Treasury spending caps and pause controls
- Emergency multi-sig guardian with auto-expiry
- Mobile/client deployment manifest format for app integrations

## Storefront And Mobile Readiness

Google Play, App Store, and enterprise distribution do not sell raw smart contracts. They sell a client application plus a service promise. For GOVDAO, that means:

- a mobile client that reads deployment manifests and renders proposals, votes, treasury state, and alerts
- a configurable deployment profile per customer or network
- a compliance-safe purchase flow for subscriptions, support, or hosted indexing
- a clear separation between on-chain governance and optional off-chain convenience services

See [docs/MOBILE_DISTRIBUTION.md](docs/MOBILE_DISTRIBUTION.md), [docs/COMMERCIALIZATION.md](docs/COMMERCIALIZATION.md), and [config/mobile-app.manifest.example.json](config/mobile-app.manifest.example.json).

For current build status and the next planned milestones, see [docs/PROJECT_HANDOFF.md](docs/PROJECT_HANDOFF.md).

## Commands

- `npm run compile`
- `npm test`
- `npm run deploy:local`
- `npm run deploy:sepolia`
- `npm run export:manifest -- --output config/mobile-app.manifest.local.json`
- `npm run validate:google-play -- --manifest config/mobile-app.manifest.local.json`
- `npm run release:google-play`
- `npm run mobile:sync-manifest`
- `npm run mobile:check-manifest`
- `npm run mobile:check-data`
- `npm run mobile:validate`
- `npm run mobile:typecheck`
- `npm run mobile:start`

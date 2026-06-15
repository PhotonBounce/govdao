# GOVDAO

On-chain governance for member-led organizations — a complete, tested governance
kernel plus a polished mobile client that operates it from your pocket.

GOVDAO is two things in one repo:

1. **A Solidity governance kernel** — Governor, Timelock, Treasury, MemberRegistry,
   and an EmergencyGuardian — with equal-weight member voting, timelocked execution,
   treasury spend caps, and a multi-sig emergency pause. 39 passing unit tests.
2. **A React Native / Expo mobile app** (`apps/mobile`) that connects to a deployed
   kernel and lets every member sign in, vote, propose, manage treasury, and more —
   targeting the Google Play Store.

## Status at a glance

| Area | State |
|------|-------|
| Smart contracts | ✅ 5 contracts, 39 unit tests, deploy script |
| Mobile app | ✅ Feature-complete in demo (fixture) mode |
| Live on-chain layer | ✅ **Proven end-to-end in CI** — see below |
| Google Play submission | ⛔ Needs your keys/hosting (see `docs/RELEASE_CHECKLIST.md`) |

The mobile app runs in **fixture mode** out of the box (sample data, no chain needed),
and switches to **live mode** automatically once the manifest points at a real RPC
endpoint and deployed contract addresses — without any UI or controller changes.

### Live paths are proven, not assumed

Every CI run deploys the real governance kernel to a live EVM node and then drives the
**app's own code** against it as real transactions — sign in (role read from the
registry), read treasury/registry state, submit a proposal, and cast a vote — asserting
the on-chain results (`apps/mobile/scripts/check-onchain-e2e.mjs`, 21 assertions). The
mobile contract ABIs are kept in exact sync with `contracts/interfaces/*.sol`.

## Mobile app features

Sign-in (WalletConnect / Coinbase / injected / passkey), proposal list + binding
on-chain voting with verifiable receipts, proposal creation, treasury dashboard with
spend caps and timelocked spend requests, emergency-guardian readiness drills, member
registry + invites, governance **analytics** (participation, pass rate, delegates),
a governance **calendar** (chain-anchored countdowns), an **activity feed** with CSV/JSON
export, a 5-step contract **deploy wizard**, **quick-jump search**, and **preferences**
(sound + reduce-motion accessibility). Dark animated theme with a code-rain background,
animated buttons, and sound cues.

## Quick start

**Windows (easiest):** double-click [`start.bat`](start.bat). It checks Node, installs
dependencies, and gives you a menu — run in the browser, run on your phone via Expo Go,
run the full QA suite, or build an APK. See [docs/ANDROID_BUILD.md](docs/ANDROID_BUILD.md).

**Any platform:**

```bash
npm install                 # root (contracts) deps
npm --prefix apps/mobile install
npm test                    # 39 contract tests
npm run mobile:check-all    # typecheck + all mobile QA gates
npm --prefix apps/mobile run web   # run the app in a browser
```

## Going live (demo → testnet → published)

The app is configured for **Ethereum mainnet** (`chain.id` 1). One command deploys the
contracts and generates a wired production manifest:

```bash
export MAINNET_RPC_URL="https://..." DEPLOYER_PRIVATE_KEY="0x..." CONFIRM_MAINNET=yes
bash scripts/deploy-and-wire.sh mainnet
```

A mainnet deploy spends real ETH and is irreversible — a free Sepolia dry-run first is
recommended (`bash scripts/deploy-and-wire.sh sepolia`).

Then validate, host the legal pages, sign, and submit. The full ordered path —
including which steps need your machine/keys — is in
[docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md). Android signing is covered in
[docs/SIGNING.md](docs/SIGNING.md).

## Layout

```
contracts/            Solidity kernel + interfaces
test/                 Hardhat test suite (39 tests)
scripts/              deploy.ts, deploy-and-wire.sh, wire-manifest.ts, keystore, microsite
apps/mobile/          Expo app — src/ (screens, components, data, hooks), scripts/ (QA gates)
config/               manifest model + Play Store listing/data-safety/content-rating + screenshots
docs/                 distribution, signing, release checklist, protocol, handoff
microsite/            marketing site + embedded web demo
```

## Testing

- **Contracts:** `npm test` (39 Hardhat tests), `npm run compile`.
- **Mobile:** `npm run mobile:check-all` runs `mobile:typecheck` + ~29 headless QA gates
  that exercise every data source and screen logic in fixture mode.
- **On-chain end-to-end:** the CI "Deploy and read verification" job
  (`npm run mobile:check-onchain-e2e`) proves the live layer against a real deployed
  kernel.
- **Wiring:** `npm run check:wire-manifest` validates the production-manifest generator.

## Key commands

| Command | Purpose |
|---------|---------|
| `npm test` | Contract test suite |
| `npm run compile` | Compile contracts |
| `npm run deploy:local` / `deploy:sepolia` | Deploy the kernel |
| `npm run deploy:and-wire -- sepolia` | Deploy + generate production manifest |
| `npm run wire:manifest -- --network sepolia` | Wire a manifest from a deployment record |
| `npm run validate:google-play -- --manifest <path>` | Store-readiness validator |
| `npm run mobile:check-all` | Typecheck + all mobile QA gates |
| `npm run mobile:check-onchain-e2e` | On-chain end-to-end (needs a running node) |
| `npm run mobile:start` / `mobile:typecheck` | Run / typecheck the app |

## Docs

[Release checklist](docs/RELEASE_CHECKLIST.md) ·
[Android build](docs/ANDROID_BUILD.md) ·
[Signing](docs/SIGNING.md) ·
[Mobile distribution](docs/MOBILE_DISTRIBUTION.md) ·
[Commercialization](docs/COMMERCIALIZATION.md) ·
[Protocol](docs/PROTOCOL.md) ·
[Project handoff](docs/PROJECT_HANDOFF.md)

# GOVDAO Release Checklist — Demo → Live → Published

This is the exact, ordered path from the current state (a fully-tested app running in
demo/fixture mode) to a live product on a real chain and on the Google Play Store.

Each item says **who/what** can do it. Items marked 🔒 require a secret, a funded key, a
paid account, or a desktop with the Android SDK — they cannot be done from the cloud
session, only on your machine.

## Status today
- ✅ 5 smart contracts, 39 passing unit tests.
- ✅ Deploy script (`scripts/deploy.ts`) — proven on a local Hardhat node in CI.
- ✅ Mobile contract layer (ABIs + live read/write paths) now matches the deployed
  Solidity exactly, and is proven end-to-end against a real EVM chain by
  `mobile:check-onchain-e2e` (CI deploys the kernel, then the app's own
  `connectSession → loadOnchainSnapshot → submitProposalDraft → castVoteTransaction`
  run as real transactions).
- ⛔ App still ships in **fixture mode** (placeholder RPC + zero contract addresses).
- ⛔ Never deployed to a public testnet/mainnet.
- ⛔ No signed Android build produced; privacy policy not yet hosted.

## Phase 1 — Deploy contracts to a testnet (Sepolia) 🔒
1. Get a Sepolia RPC URL (Alchemy/Infura/public) and a deployer private key funded with
   a little Sepolia ETH (from a faucet).
2. Export them and deploy:
   ```bash
   export SEPOLIA_RPC_URL="https://..."
   export DEPLOYER_PRIVATE_KEY="0x..."         # funded account
   # optional: seed extra members/proposers
   export INITIAL_PROPOSERS="0xabc...,0xdef..."
   npx hardhat run scripts/deploy.ts --network sepolia | tee deploy.sepolia.log
   ```
3. Copy the five printed addresses (MemberRegistry, Timelock, Governor, Treasury,
   EmergencyGuardian).

## Phase 2 — Wire the app to the live deployment
4. In `config/mobile-app.manifest.example.json` (or a production copy), set:
   - `chain.rpcUrl` → your Sepolia RPC URL
   - `chain.id` / `chain.name` → 11155111 / sepolia (already set)
   - `contracts.*` → the five deployed addresses
   - `support.website`, `email`, `privacyPolicyUrl`, `termsOfServiceUrl`, and the
     `services.*` URLs → real HTTPS values
5. Sync + validate until clean:
   ```bash
   npm --prefix apps/mobile run sync:manifest
   npm run export:manifest -- --output /tmp/m.json
   npm run validate:google-play -- --manifest /tmp/m.json     # must print no errors
   ```
   With non-placeholder values the app leaves fixture mode and the live read/write
   paths activate automatically.

## Phase 3 — Test the live build on the testnet 🔒
6. `start.bat` → option 2, connect a wallet funded on Sepolia, and exercise:
   sign-in (role reads from the registry), create a proposal, cast a vote. These now
   hit the real Governor — the same flow CI proves with `mobile:check-onchain-e2e`.

## Phase 4 — Host the legal pages + microsite 🔒
7. From your machine (FTP is blocked in the cloud session):
   ```bash
   FTP_HOST=photon-bounce.com FTP_USER=photonb FTP_PASS='…' bash scripts/deploy-microsite.sh
   ```
   Confirm `https://photon-bounce.com/privacy-policy.html` loads, then use that URL in
   the manifest (step 4) and the Play data-safety form.

## Phase 5 — Build, sign, and submit to Google Play 🔒
8. Generate the upload keystore (see `docs/SIGNING.md`):
   ```bash
   KEYSTORE_PASSWORD='…' KEY_PASSWORD='…' bash scripts/generate-keystore.sh
   ```
9. Build a signed AAB:
   ```bash
   cd apps/mobile && cp credentials.json.example credentials.json
   KEYSTORE_PASSWORD='…' KEY_PASSWORD='…' eas build -p android --profile production
   ```
10. In Play Console: create the app, upload the AAB to Internal testing, fill the
    listing from `config/play-store/store-listing.md`, the data-safety form from
    `config/play-store/data-safety.md`, and the content rating from
    `config/play-store/content-rating.md`. Upload screenshots (real device captures are
    preferred over the generated previews in `config/play-store/screenshots/`).
11. Promote Internal → Closed → Production once you've tested the signed build on a
    real device.

## Definition of "fully ready"
`npm run validate:google-play` passes with **zero** errors, the app is connected to a
deployed contract set, the live flow has been tested on-device against that chain, the
privacy policy is reachable at a real URL, and a signed AAB is uploaded to Play Console.

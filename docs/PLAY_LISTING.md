# Google Play Listing And Data Safety Worksheet

Everything Play Console asks for at submission time, pre-filled from the manifest and the app's actual behavior. Update alongside any feature change that touches data handling.

## Store listing

- **App name:** GOVDAO
- **Short description (30–80 chars):** Transparent governance for member-led organizations.
- **Full description:** GOVDAO gives members a secure mobile interface for proposals, voting, treasury transparency, and emergency governance status. Review on-chain proposals and hybrid motions, verify proposal documents against their anchored hashes, track treasury balances and spending caps, and monitor the emergency guardian — all from one client configured by your organization's deployment manifest.
- **Category:** Business
- **Tags:** governance, DAO, treasury, voting (avoid investment/earnings phrasing — see docs/MOBILE_DISTRIBUTION.md compliance positioning)
- **Contact email / website / privacy policy:** use the production values from `support.*` in the deployment manifest. The privacy policy URL must serve the reviewed version of [docs/legal/PRIVACY_POLICY.md](legal/PRIVACY_POLICY.md).

### Graphics checklist

- App icon 512×512 (export from `apps/mobile/assets/icon.png`)
- Feature graphic 1024×500 (compose from the seal mark + wordmark)
- At least 2 phone screenshots per form factor (capture Overview, Proposals, Treasury & Safety, and a proposal detail with the Integrity card)

## Data safety form answers

Based on current app behavior (no analytics SDKs, no ads, empty Android permissions list — `INTERNET` only):

| Question | Answer |
| --- | --- |
| Does your app collect or share user data? | Yes (wallet address as user identifier, processed for app functionality) |
| Wallet address | Collected, not shared; required for sign-in and signing; not used for tracking |
| Personal info (name, email) | Only if the user emails support (off-app) — answer "No" for in-app collection |
| Location, contacts, photos, files, health | Not collected |
| Data encrypted in transit? | Yes (HTTPS/WSS to configured services; JSON-RPC over HTTPS) |
| Can users request deletion? | Yes for off-chain service data via support; on-chain data is immutable public ledger data (explain in the free-text field) |

If the deployment enables hosted notifications or off-chain document services, revisit the "shared with third parties" answers for that operator before submitting.

## Content rating questionnaire

- No user-generated public content inside the app shell (motions/documents are organization-private; answer per IARC guidance for "business tools")
- No gambling, no real-money trading features; voting is organizational, not wagering
- Expected rating: Everyone / PEGI 3

## Release flow

1. Provide production env values and run `npm run release:google-play` until it passes with zero errors.
2. `cd apps/mobile && npx eas build --profile production --platform android` (requires an Expo account + EAS project id).
3. Upload the AAB to the **internal testing** track first; run the device pilot from the Settings screen checklist.
4. Complete data safety + content rating with the answers above, attach the hosted privacy policy URL, then promote to closed/open testing before production.

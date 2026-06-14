# Google Play Data Safety Questionnaire

## Does your app collect or share any of the required user data types?

**No personal data collected or stored by the app.**

### Data Collected

| Data Type | Collected? | Notes |
|-----------|-----------|-------|
| Name | No | — |
| Email address | No | — |
| User IDs | No | — |
| Address | No | — |
| Phone number | No | — |
| Race and ethnicity | No | — |
| Political or religious beliefs | No | — |
| Sexual orientation | No | — |
| Other personal info | No | — |
| Payment info | No | — |
| Purchase history | No | — |
| Credit score | No | — |
| Health info | No | — |
| Fitness info | No | — |
| Emails or text messages | No | — |
| Photos or videos | No | — |
| Voice or sound recordings | No | — |
| Music files | No | — |
| Files and docs | No | — |
| Calendar events | No | — |
| Contacts | No | — |
| SMS or MMS | No | — |
| Web browsing history | No | — |
| Search history | No | — |
| Other user-generated content | No | — |
| Crash logs | No | — |
| Diagnostics | No | — |
| Other app performance data | No | — |
| Installed apps | No | — |
| Device or other IDs | No | — |

### On-Chain Data

The app reads and writes to public blockchain networks. Ethereum wallet addresses are used to identify members in the on-chain MemberRegistry contract. This is public blockchain data — not collected or stored by the app.

- **Wallet address**: Used to identify the connected member on-chain. Not stored by the app. Publicly visible on the blockchain.
- **Vote choices**: Recorded on-chain by the Governor contract. Publicly visible on the blockchain. Not stored by the app.
- **Proposal text**: Submitted on-chain by the Governor contract. Publicly visible on the blockchain. Not stored by the app.

### Third-Party Services

The app communicates with:
- **Your organization's RPC endpoint**: Reads contract state. No user data is sent beyond the wallet address for contract calls.
- **WalletConnect relay** (optional): Used for wallet pairing. Subject to WalletConnect's privacy policy.

### Data Sharing

No user data is shared with third parties by the app.

### Data Security

- All data in transit uses HTTPS/WSS
- No personal data is stored locally beyond session state (cleared on sign-out)
- No analytics SDKs, advertising SDKs, or tracking libraries included

## Is your app directed to children under 13?

No.

## Does your app include ads?

No.

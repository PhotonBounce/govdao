# GOVDAO Project Handoff

## 1. Project Overview
**GOVDAO** is an enterprise-grade, on-chain governance kernel designed for organizations requiring transparent proposals, voting, timelocked execution, treasury controls, and limited emergency powers.

The project goes beyond just smart contracts; it provides a comprehensive **product and distribution layer**, including a hybrid React Native mobile client that integrates with on-chain data and off-chain services via a configurable manifest system.

### Core Value Proposition
- **Trustless Infrastructure:** Open-source Solidity smart contracts ensuring transparent operations.
- **Enterprise Readiness:** Built for App Store and Google Play distribution, focusing on compliance, safety, and legitimate organizational governance rather than token speculation.
- **Hybrid Governance:** Supports fully on-chain execution for high-stakes decisions and off-chain motions/document flows for day-to-day operations.

---

## 2. Architecture & Technical Stack

The repository is structured as a monorepo containing both the protocol and the client apps.

### 2.1 Protocol Layer (`/contracts`, `/ignition`)
- **Smart Contracts:** Solidity-based governance kernel featuring equal-weight voting, timelock execution, and treasury management.
- **Framework:** Hardhat with Ethers v6 and TypeChain for robust testing and typing.
- **Key Mechanics:**
  - Strict state machine (`PROPOSED -> VOTING -> QUEUED -> EXECUTED`).
  - Multi-sig Guardian role with temporary pause powers (max 72h) that cannot move funds.
  - Non-upgradeable v1 contracts to minimize attack surface.

### 2.2 Application Layer (`/apps/mobile`)
- **Mobile Client:** A React Native/Expo application acting as a companion workspace and governance hub.
- **Manifest-Driven UI:** The app reads a deployment manifest (`config/mobile-app.manifest.*.json`) to dynamically configure networks, contract addresses, feature flags, and hosted endpoints.
- **Capabilities:** Wallet connection, proposal feeds, vote casting, treasury dashboards, and off-chain companion modules.

---

## 3. Commercialization & Distribution

The core strategy is to open-source the protocol while monetizing the operational, distribution, and convenience layers.

### Packaging Tiers
1. **Free/Developer:** Raw smart contracts and testnet deployments.
2. **Paid Teams:** Hosted notifications, fast indexing, search, and support.
3. **Enterprise/White-Label:** Custom branding, SSO, SLAs, managed deployments, and compliance playbooks.

### App Store Strategy
The mobile app is designed to pass strict App Store/Google Play reviews by:
- Operating as a standard B2B/productivity tool.
- Separating on-chain execution from off-chain convenience services (like subscriptions).
- Removing any framing related to investment, yield, or passive income.

---

## 4. Where We Are Going (Roadmap & Next Steps)

Based on the current trajectory, the next phases of development and business execution are:

### Short-Term
- **Stabilize Mobile Client:** Finalize the React Native flows in `apps/mobile`, ensuring the manifest sync and data loader work seamlessly with the testnet contracts.
- **Store Submissions:** Push the initial mobile client to Google Play and the App Store using the automated release gates (`npm run release:google-play`).
- **Web Dashboard:** Build or refine a hosted web interface as the primary onboarding funnel before users download the mobile app.

### Mid-Term
- **Hybrid Service Expansion:** Flesh out the off-chain APIs for draft motions, meeting notes, and delegated approvals that do not need to settle directly on the blockchain.
- **Module Ecosystem:** Develop additional "companion modules" (e.g., document rooms, analytics, fiat payment integration) that bundle into the mobile app via the manifest.

### Long-Term
- **Institutional Onboarding:** Target municipalities, co-ops, unions, and corporate committees with white-label deployments.
- **Protocol V2:** Explore opt-in modularity or parameter upgrades as DAOs mature and request custom voting weights or delegation features (while maintaining the non-upgradeable security ethos).

---

> [!TIP]
> **Developer Setup:** To get started locally, run `npm install`, compile the contracts with `npm run compile`, and start the mobile client using `npm run mobile:start`. Use the manifest scripts (`npm run mobile:sync-manifest`) to keep the app configured correctly.

export interface InfoEntry {
  title: string;
  body: string;
  example?: string;
  onchain?: string;
}

export const infoContent: Record<string, InfoEntry> = {
  // ── Overview ────────────────────────────────────────────────────────────
  "overview": {
    title: "Governance Overview",
    body: "Your command center for the DAO. Shows live member count, active proposals, treasury health, and guardian status at a glance so you can see what needs attention before diving into any section.",
    example: "If the guardian is paused, a warning appears here first — you don't have to hunt for it.",
    onchain: "Reads MemberRegistry.getMemberCount() and Treasury.paused() over the configured RPC endpoint."
  },
  "member-registry": {
    title: "Member Registry",
    body: "The on-chain list of addresses authorized to participate in governance. Every vote, proposal, and motion is gated by membership. Adding or removing a member requires a governance motion approved by the current quorum.",
    example: "When you invite a new delegate, their address is queued in a 24-hour timelock before it lands in the registry.",
    onchain: "MemberRegistry.isMember(address) — returns true/false for any wallet."
  },
  "governance-mode": {
    title: "Governance Mode",
    body: "Controls how decisions are made. 'On-chain' mode requires proposals to pass through the Governor smart contract with binding votes. 'Off-chain' mode uses signed motions that can later be anchored on-chain for audit trail.",
    example: "A DAO in bootstrap phase often runs off-chain to move faster, then upgrades to on-chain once membership stabilizes.",
    onchain: "Governor.votingMode() returns the current mode string."
  },
  "data-status": {
    title: "Data Feed Status",
    body: "Shows where the app's data comes from right now. 'Fixture' means locally bundled demo data — great for previewing and testing. 'Live' means the app is reading real on-chain state from the configured RPC endpoint.",
    example: "If you see FIXTURE TX badges on receipts, the app is running in preview mode — no real transactions were sent.",
    onchain: "Fixture mode simulates the exact same response shapes as live RPC calls so the UI behaves identically."
  },
  "launchpad": {
    title: "Governance Launchpad",
    body: "One-tap shortcuts to the most common actions for your role. Proposers see 'Create Proposal'. Treasury signers see 'Request Spend'. Guardian signers see 'Schedule Drill'. The launchpad adapts to your connected wallet's role.",
    example: "A delegate with Reviewer role sees 'Cast Vote' and 'Approve Motion' as their primary shortcuts."
  },
  "offchain-auth": {
    title: "Off-Chain Authentication",
    body: "Some governance actions use signed messages instead of on-chain transactions. These are faster and gas-free, but may be anchored to a public bulletin board or IPFS later for verifiability. The receipt shows the signing method used.",
    example: "A passkey-signed motion is cryptographically tied to your device — nobody can forge it even without a wallet.",
    onchain: "The signed payload hash can be submitted to Governor.anchorOffchainDecision() to create an immutable audit trail."
  },

  // ── Session / Auth ───────────────────────────────────────────────────────
  "member-session": {
    title: "Member Session",
    body: "Your active identity for this governance session. The session is tied to the connected wallet address. Your role (Proposer, Delegate, Guardian, Reviewer) determines which actions you can take. Sessions are stateless — nothing is stored on a server.",
    example: "Connecting as a Guardian wallet unlocks the Emergency Pause and Drill controls that are hidden from regular delegates.",
    onchain: "MemberRegistry.getRole(address) is called once at sign-in and mapped from the Role enum (NONE, MEMBER, PROPOSER, EXECUTOR, ADMIN, GUARDIAN) to a label."
  },
  "wallet-connect": {
    title: "WalletConnect",
    body: "An open protocol for connecting mobile wallets to dApps via QR code or deep link. Your wallet stays on your device — the app only receives your public address and signed transaction approvals.",
    example: "Scan the QR code with MetaMask, Rainbow, or any WalletConnect-compatible wallet to sign governance actions.",
    onchain: "All on-chain votes and proposals are signed by your wallet's private key, which never leaves your device."
  },
  "session-role": {
    title: "Member Role",
    body: "Your governance role determines what you can do. Proposers can create proposals. Delegates can vote. Guardians can pause the treasury and schedule drills. Reviewers can approve off-chain motions. Roles are set in the Member Registry and can be updated by governance vote.",
    example: "A member can hold multiple roles — e.g. Proposer + Delegate — if the registry grants them both."
  },

  // ── Proposals ───────────────────────────────────────────────────────────
  "proposals-list": {
    title: "Proposals",
    body: "On-chain governance proposals that the full membership votes on. Each proposal has a title, summary, and optional supporting document hash. Proposals progress through Draft → Voting → Queued → Executed states tracked on-chain.",
    example: "A proposal to upgrade the treasury spend cap requires 50%+1 of members to vote For before it moves to the timelock queue.",
    onchain: "Governor.getProposalState(proposalId) returns the current state as a uint8 enum."
  },
  "quorum": {
    title: "Quorum",
    body: "The minimum number of unique member votes required before a proposal outcome is binding. Quorum prevents a tiny minority from passing consequential changes when most members haven't weighed in. It's calculated as a percentage of total membership, rounded up.",
    example: "With 7 members and a 50% quorum threshold, at least 4 members must vote (⌈7×0.5⌉ = 4).",
    onchain: "Governor.quorumNumerator() over the constant QUORUM_DENOMINATOR (100) defines the fraction; Governor.quorumVotes(proposalId) returns the absolute count required."
  },
  "voting-period": {
    title: "Voting Period",
    body: "The window of time (in blocks) during which members can cast their votes on a proposal. Once the voting period ends, the result is tallied. Late votes are not counted — so check open proposals regularly.",
    example: "A 7-day voting period on a chain with 12-second blocks is roughly 50,400 blocks.",
    onchain: "Governor.votingPeriod() returns block count; block timestamp is used to display the human-readable deadline."
  },
  "proposal-integrity": {
    title: "Proposal Integrity",
    body: "A cryptographic fingerprint of the proposal's on-chain calldata. If the description or calldata ever changes after submission, the hash won't match — instantly proving tampering. This is what makes on-chain governance trustless.",
    example: "Two identical-looking proposals with different calldata have completely different hashes, exposing any bait-and-switch attempt.",
    onchain: "Each proposal carries a metadataHash (keccak256 of its off-chain metadata) stored on the Governor and verifiable against the document."
  },
  "proposal-states": {
    title: "Proposal States",
    body: "Every proposal moves through a lifecycle: Pending (not yet voteable) → Active (voting open) → Succeeded or Defeated (voting closed) → Queued (awaiting timelock) → Executed (changes applied on-chain). Cancelled and Expired are terminal failure states.",
    example: "A proposal that reaches Quorum but loses the vote moves to Defeated and cannot be re-queued without a new submission.",
    onchain: "Governor.getProposalState(proposalId) returns the ProposalState enum (0=Proposed, 1=Voting, 2=Defeated, 3=Succeeded, 4=Queued, 5=Cancelled, 6=Executed)."
  },
  "vote-ballot": {
    title: "Member Ballot",
    body: "Cast your vote on an active proposal: For, Against, or Abstain. Abstain counts toward quorum (your participation is recorded) but doesn't affect the For/Against outcome. You can vote once per proposal — changing votes is not supported in the base Governor.",
    example: "Abstaining is useful when you want to help the proposal reach quorum but have a conflict of interest.",
    onchain: "Governor.castVote(proposalId, support) — support is 0=Against, 1=For, 2=Abstain."
  },
  "vote-receipt": {
    title: "Vote Receipt",
    body: "Cryptographic proof that your vote was recorded. The receipt shows the transaction hash, your voter address, and the choice you made. Save this if you ever need to prove participation in a dispute or governance audit.",
    example: "A FIXTURE TX badge means this is a demo receipt — the transaction hash is simulated and nothing was sent to the chain.",
    onchain: "Governor.hasVoted(proposalId, account) confirms your vote is recorded on-chain."
  },
  "vote-tally": {
    title: "Vote Tally",
    body: "A live breakdown of For / Against / Abstain votes by count and weight. If delegation is active, one member may represent the voting power of multiple delegates. The tally refreshes whenever the on-chain snapshot updates.",
    example: "A delegate holding 3 delegated votes counts as 3 in the For column if they vote For.",
    onchain: "Governor.getProposal(proposalId) returns the proposal struct including forVotes, againstVotes and abstainVotes as uint256 weights."
  },

  // ── Create Proposal ──────────────────────────────────────────────────────
  "create-proposal": {
    title: "Create Proposal",
    body: "Submit a new governance proposal for the membership to vote on. Every proposal needs a clear title, a detailed summary explaining the rationale, and optionally a supporting document URI with a content hash for verification. The calldata defines what the Governor will execute if the proposal passes.",
    example: "A proposal to change the treasury spend cap would include calldata that calls Treasury.setSpendCapPerTx(newAmount).",
    onchain: "Governor.propose(targets, values, calldatas, description) emits a ProposalCreated event with the new proposalId."
  },
  "proposal-doc": {
    title: "Supporting Document",
    body: "An optional URI pointing to a detailed specification, research, or legal document backing the proposal. The hash proves the document hasn't changed since submission — anyone can independently verify the content matches.",
    example: "Pinning a PDF to IPFS and recording its SHA-256 hash lets members verify the full text without trusting a centralized server.",
    onchain: "The doc hash is encoded in the proposal description and included in the integrity hash computation."
  },

  // ── Motions ─────────────────────────────────────────────────────────────
  "motions-list": {
    title: "Motions",
    body: "Off-chain governance decisions that operate on a faster cycle than full on-chain proposals. Motions are approved or returned by designated reviewers and can optionally be anchored to a public bulletin for audit trail. Useful for operational decisions that don't change contract code.",
    example: "Approving a vendor invoice, scheduling a team event, or ratifying a policy document can all be motions.",
    onchain: "Motion approvals can be anchored via Governor.anchorOffchainDecision(motionId, decisionHash)."
  },
  "motion-detail": {
    title: "Motion Detail",
    body: "The full context for a pending off-chain motion: the action requested, current status, and the delegate panel showing who approved or returned it. Motions move faster than proposals because they don't require a full on-chain vote.",
    example: "A motion to Approve a grant disbursement typically resolves within hours vs. the 7-day voting window for a proposal.",
    onchain: "If voteAnchoringEnabled, the approval hash is posted to chain so anyone can verify the outcome."
  },
  "motion-decision": {
    title: "Motion Decision",
    body: "Your formal Approve or Return decision on an off-chain motion. Approve signals agreement; Return sends it back for revision with the expectation of resubmission. The decision is cryptographically signed by your session wallet.",
    example: "Returning a motion doesn't reject it permanently — the submitter can revise and resubmit with the feedback addressed.",
    onchain: "The signed decision hash can be verified with ecrecover — the reviewer's address is recoverable without revealing their private key."
  },
  "decision-receipt": {
    title: "Decision Receipt",
    body: "Proof that your motion decision was recorded. Shows the motion ID, your decision (Approved / Returned), and the transaction or anchor hash. Useful for governance records and dispute resolution.",
    example: "An anchored decision receipt can be referenced in a later proposal if the motion outcome is ever contested."
  },

  // ── Treasury ─────────────────────────────────────────────────────────────
  "treasury": {
    title: "Treasury",
    body: "The on-chain vault holding DAO funds. All outflows require a governance-approved spend request routed through the timelock. The balance, pause state, and per-transaction cap are visible at a glance. Pausing the treasury prevents any outflows until unpaused by guardian consensus.",
    example: "If a suspicious transaction is detected, any guardian can pause the treasury within seconds, buying time to investigate.",
    onchain: "Treasury.getBalance() returns the current ETH balance; Treasury.paused() returns the pause state."
  },
  "spend-cap": {
    title: "Per-Transaction Spend Cap",
    body: "The maximum ETH that can leave the treasury in a single spend request. This cap is a hard limit enforced by the smart contract — no single request can exceed it, even if the governance vote passes. Changing the cap requires a full governance proposal.",
    example: "A cap of 25 ETH means a request for 30 ETH will revert on-chain even if approved, protecting against fat-finger errors.",
    onchain: "Treasury.spendCapPerTx() exposes the cap; it is enforced inside Treasury.transferETH() with a require() check."
  },
  "treasury-movements": {
    title: "Treasury Movements",
    body: "A chronological log of all ETH inflows and outflows from the treasury. Each movement shows the amount, direction (in/out), recipient or source address, and the proposal or request that authorized it. Useful for financial audits and DAO transparency reports.",
    example: "Clicking any movement shows the full on-chain transaction hash and block explorer link for independent verification.",
    onchain: "Emitted as Transfer events from the Treasury contract; indexed by The Graph or queried via eth_getLogs."
  },
  "spend-request": {
    title: "Spend Request",
    body: "A formal request to release funds from the treasury. The request specifies a title, ETH amount, recipient address, and purpose statement. It's routed through the timelock — a mandatory delay before execution that gives members time to veto if something looks wrong.",
    example: "A spend request for 5 ETH to pay a security auditor goes into the queue, waits the timelock period, then executes automatically.",
    onchain: "A spend is enacted through governance: a proposal whose action calls Treasury.transferETH(recipient, amount) is queued via Timelock.queueAction after it passes."
  },
  "timelock": {
    title: "Timelock",
    body: "A mandatory waiting period between when an action is approved and when it executes. The timelock gives the community time to detect and veto malicious or mistaken decisions before they take effect. All treasury outflows and governance parameter changes go through the timelock.",
    example: "A 48-hour timelock means even if a proposal passes at midnight, it won't execute until 48 hours later — giving plenty of time to raise an alarm.",
    onchain: "Timelock.getDelay() returns the current delay in seconds. Queued actions are identified by a bytes32 actionId."
  },

  // ── Guardian ─────────────────────────────────────────────────────────────
  "emergency-guardian": {
    title: "Emergency Guardian",
    body: "A multi-signature group with the power to pause the treasury and contracts in an emergency — like a smart contract exploit or governance attack. Guardian actions are separate from the normal governance process so they can respond in minutes, not days.",
    example: "If a governance exploit is announced, the guardian can pause the treasury before any funds move, even while a full vote is being organized.",
    onchain: "EmergencyGuardian.proposePause() → confirmedBy >= threshold → executes Treasury.pause()."
  },
  "guardian-threshold": {
    title: "Guardian Threshold",
    body: "The minimum number of guardian signers who must co-sign an emergency action for it to execute. A threshold of 2-of-3 means any two of the three guardians must agree. This prevents a single compromised guardian key from triggering an emergency unilaterally.",
    example: "Threshold 2/3: even if one guardian's key is stolen, the attacker cannot pause or unpause the treasury alone.",
    onchain: "EmergencyGuardian.threshold() — confirmed signatures are tracked in EmergencyGuardian.confirmations(actionId, signer)."
  },
  "guardian-drill": {
    title: "Guardian Drill",
    body: "A scheduled test of the emergency guardian's ability to co-sign and execute a pause. Drills prove the signing keys are accessible and all guardians are reachable — so the team is ready if a real emergency happens. No real funds move during a drill.",
    example: "A monthly drill might require all 3 guardians to co-sign a test pause within a 4-hour window. Failure to complete triggers an alert.",
    onchain: "Drill events are emitted by EmergencyGuardian.emitDrillLog(drillId, outcome) and can be queried as governance health metrics."
  },
  "schedule-drill": {
    title: "Schedule Drill",
    body: "Queue a new guardian drill for the co-signing team. Choose the drill type (pause, resume, or full-cycle), set a completion window in hours, and add notes describing what the team should test. The drill is logged on-chain when the window opens.",
    example: "A full-cycle drill tests both pause and unpause in sequence — verifying the entire emergency response flow end-to-end.",
    onchain: "A drill is a readiness rehearsal: the app reads EmergencyGuardian.getSigners() and isPaused() to confirm the guardian is armed, without changing state."
  },
  "drill-types": {
    title: "Drill Types",
    body: "Pause drills test the ability to freeze the treasury. Resume drills test unfreezing after a pause. Full-cycle drills test both in sequence and are the most comprehensive — they simulate a complete emergency response from incident detection to resolution.",
    example: "Start with pause drills to confirm the signing keys work, then graduate to full-cycle drills once the team is comfortable.",
    onchain: "Drill type is encoded in the DrillScheduled event's data field as a uint8 (0=pause, 1=resume, 2=full-cycle)."
  },

  // ── Members / Invite ─────────────────────────────────────────────────────
  "members-panel": {
    title: "Members Panel",
    body: "The current list of addresses with governance rights. Each member has an ID, wallet address, display name, and role. The total count determines quorum thresholds for all proposals — adding or removing members directly affects the vote count needed to pass anything.",
    example: "Expanding from 4 to 8 members doubles the quorum count — proposals that previously passed with 3 votes now need 5.",
    onchain: "MemberRegistry.getMembers() returns a paginated list of Member structs with id, address, role, and joinedAt."
  },
  "delegate-profile": {
    title: "Delegate Profile",
    body: "A governance record for a specific member showing their participation rate, recent voting history, delegated power, and preferred positions. High participation rates indicate active, reliable delegates. This helps you decide who to delegate your votes to.",
    example: "A delegate with 95% participation over 20 proposals is far more reliable than one with 40% who missed most recent votes.",
    onchain: "Participation rate is computed from Governor.hasVoted() across all proposal IDs during the member's tenure."
  },
  "invite-member": {
    title: "Invite Member",
    body: "Propose adding a new address to the Member Registry with a specific role. The invite is queued in a 24-hour timelock — giving existing members a window to veto if the address is wrong or the role is inappropriate. After the timelock, the address is added automatically.",
    example: "Inviting a new Delegate takes 24 hours from invitation to active membership — plan ahead for governance votes that need their participation.",
    onchain: "A member is added through governance: a proposal whose action calls MemberRegistry.addMember(address, role) takes effect once executed."
  },
  "member-roles": {
    title: "Member Roles",
    body: "Roles define what each member can do. Proposers submit proposals. Delegates vote. Guardians control emergency actions. Reviewers approve off-chain motions. Operators manage workspace items. One address can hold multiple roles if the registry grants them.",
    example: "The founding team often starts as Proposer+Guardian+Delegate, then gradually separates roles as the DAO matures and expands.",
    onchain: "Roles are stored in MemberRegistry as a bytes32 bitmask — each bit corresponds to a permission flag."
  },

  // ── Modules ──────────────────────────────────────────────────────────────
  "modules": {
    title: "Governance Modules",
    body: "Pluggable extensions to the core governance system. Each module adds a capability — token vesting, multi-sig wallet management, reputation scoring, or custom voting logic. Modules are approved by governance vote and can be upgraded or removed independently.",
    example: "A vesting module might let the DAO manage contributor token grants without touching the main treasury.",
    onchain: "Module addresses are registered in a ModuleRegistry contract and called via delegatecall or direct call depending on their type."
  },
  "workspace": {
    title: "Workspace Items",
    body: "Operational content managed by the DAO — grant applications, policy documents, vendor agreements, or anything that needs a formal review-and-publish workflow. Items move through Needs Review → Ready → Scheduled/Published states via off-chain motions.",
    example: "A draft partnership agreement sits in 'Needs Review' until two Reviewers approve it and it moves to 'Ready' for final publishing.",
    onchain: "Workspace item hashes can be anchored on-chain as governance decisions for a permanent, verifiable audit trail."
  },

  // ── Activity ─────────────────────────────────────────────────────────────
  "activity-feed": {
    title: "Activity Feed",
    body: "A chronological log of all governance events: votes cast, proposals created, treasury movements, guardian actions, member changes, and motion decisions. Filter by event type to focus on what matters. The feed is the single source of truth for DAO history.",
    example: "Filter to 'Guardian' events to audit all emergency actions taken in the last 90 days in one view.",
    onchain: "Sourced by indexing Transfer, ProposalCreated, VoteCast, and custom events via eth_getLogs or a subgraph."
  },
  "activity-filter": {
    title: "Activity Filters",
    body: "Narrow the activity feed to specific event categories: Votes, Proposals, Treasury, Guardian actions, Member changes, or Motions. Filters apply instantly without reloading data — the full feed is paginated in memory.",
    example: "The Treasury filter is useful when preparing a financial report — all inflows and outflows in one place, sorted newest-first."
  },

  // ── Settings ────────────────────────────────────────────────────────────
  "app-settings": {
    title: "App Settings",
    body: "Configuration for this governance client. Shows the connected manifest (which DAO you're interacting with), data endpoints, app version, and support contacts. Advanced settings include RPC endpoint overrides and feature toggles.",
    example: "If the app shows FIXTURE data and you want live data, update the RPC URL and contract addresses in the manifest here."
  },
  "notification-preferences": {
    title: "Notification Preferences",
    body: "Choose which governance events trigger push alerts and how often you want digests. Real-time mode sends a push for every event. Daily digest batches them into a morning summary. Turning off a category means you won't get alerts for it — but you can always check the Activity feed.",
    example: "Most delegates keep Votes and Proposals on real-time, and Treasury on daily digest to avoid notification fatigue.",
    onchain: "Preferences are stored in the notification service (off-chain) — they don't affect on-chain behavior."
  },
  "notification-categories": {
    title: "Notification Categories",
    body: "The five notification categories map to governance areas: Votes (when proposals open for voting), Proposals (new submissions), Guardian Events (emergency actions), Treasury Alerts (large movements), and Member Changes (invites and role updates).",
    example: "Guardian Events should always be on real-time — if someone triggers an emergency pause, you want to know immediately."
  },

  // ── Proposal timeline ────────────────────────────────────────────────────
  "proposal-timeline": {
    title: "Proposal Timeline",
    body: "A step-by-step history of a proposal's journey from submission to execution. Each step shows the block, timestamp, and any transaction hash. The current step is highlighted — so you always know exactly where the proposal is in its lifecycle.",
    example: "A timeline showing Submitted → Voting (current) tells you voting is open right now and you still have time to cast your ballot.",
    onchain: "Each state transition emits a ProposalStateChanged event that populates the timeline."
  },
  "analytics": {
    title: "Governance Analytics",
    body: "A real-time health dashboard for your DAO. Tracks participation rates across proposals, the ratio of passed to failed votes, total delegate activity, and how close each vote came to quorum. Premium members see the full breakdown with per-proposal sparklines and delegate leaderboards.",
    example: "An average participation rate of 78% means more than three-quarters of eligible members voted on each proposal — excellent for an on-chain DAO.",
    onchain: "Participation data is calculated from VoteCast events on the Governor contract. All data is public and verifiable."
  },
  "deploy-wizard": {
    title: "Contract Deploy Wizard",
    body: "A step-by-step wizard that deploys all five GOVDAO smart contracts to any EVM-compatible chain in the correct dependency order: MemberRegistry → Timelock → Governor → Treasury → EmergencyGuardian. Each step requires your wallet to sign one deployment transaction. After completion, the deployed addresses are exported as a manifest fragment you can use to configure the app.",
    example: "Deploy to Sepolia testnet first to verify governance flows before going to mainnet.",
    onchain: "Each contract deployment is an on-chain transaction. Deployment requires ETH for gas — have at least 0.1 ETH on the target chain."
  },
  "governance-calendar": {
    title: "Governance Calendar",
    body: "A unified agenda of every time-sensitive governance event: when voting opens and closes on each proposal, when timelocked actions become executable, when guardian drill windows occur, and when grace periods expire. Events are grouped by day and labelled with a live countdown so you never miss a vote or an execution window.",
    example: "\"Voting closes in 6h\" on GOV-201 means you have six hours left to cast your ballot before the window shuts.",
    onchain: "In live mode the agenda is anchored to the chain's latest block timestamp and the timelock's on-chain minimum delay, so every countdown reflects real network time rather than your device clock."
  },
  "health-score": {
    title: "Governance Health",
    body: "A single 0–100 score summarizing how healthy your DAO's governance is right now. It blends voter participation, how decisively proposals pass, the average margin above quorum, treasury status, and guardian readiness into a weighted grade (A–D) so you can see the big picture at a glance.",
    example: "A score of 78 (grade B, \"Healthy\") means strong participation and safe treasury, with some room to improve quorum margins.",
    onchain: "Each factor is derived from on-chain signals — VoteCast events, proposal outcomes, Treasury.paused(), and the EmergencyGuardian signer set."
  },
  "achievements": {
    title: "Governance Reputation",
    body: "Earn badges for participating in governance — your first vote, ten votes, creating proposals, helping reach quorum, running guardian drills, and more. Your reputation tier rises as you earn badges, turning consistent participation into a visible track record.",
    example: "Cast your first on-chain vote to unlock the \"First Ballot\" badge and move from Observer to Newcomer.",
    onchain: "Badge progress is computed from your on-chain activity (votes, proposals, drills) — it's a view over public events, not a separate token."
  },
  "preferences": {
    title: "App Preferences",
    body: "Personalize the app experience. Sound effects toggle the tap, vote and receipt cues. Reduce motion turns off the animated code-rain background and color cycling for a calmer, lower-power screen — useful for accessibility or saving battery. Haptics control vibration feedback, and compact navigation tightens the tab bar.",
    example: "Turn on Reduce Motion if animations cause discomfort or you want to extend battery life on long governance sessions.",
    onchain: "Preferences are device-local UI settings only — they never touch the chain and are not part of any transaction."
  },
  "search": {
    title: "Quick Jump Search",
    body: "A command palette for the whole app. Type any part of a screen name — or a related word like \"vote\", \"funds\", \"deadline\" or \"stats\" — and jump straight there. Results are ranked so the closest match sits on top, which keeps every screen one tap away even as the app grows.",
    example: "Typing \"spend\" surfaces both the Treasury and the Spend Request screens; \"stats\" jumps you to Analytics.",
    onchain: "Search runs entirely on-device over the app's screen index — no query ever leaves your phone."
  }
};

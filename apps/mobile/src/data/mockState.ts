export const proposalFeed = [
  {
    id: "GOV-104",
    title: "Expand emergency guardian signer set",
    state: "Queued",
    source: "On-chain",
    eta: "11h",
    summary: "Adds two institutional signers and rotates the old threshold to 3-of-5.",
    owner: "Security Council",
    nextStep: "Wait for timelock expiry and executor confirmation",
    onchainId: "1",
    docUri: "fixture://govdao/docs/gov-104",
    docHash: "0xa6bf7844d647eea9d3ecb510f58b23d4bf18fd999aca959d7c3fa907a3835020"
  },
  {
    id: "GOV-105",
    title: "Treasury reporting cadence upgrade",
    state: "Voting",
    source: "Hybrid",
    eta: "2d",
    summary: "Moves monthly treasury reports into an anchored off-chain review flow with on-chain acceptance.",
    owner: "Finance Working Group",
    nextStep: "Collect final delegate votes and publish report template",
    onchainId: "2",
    docUri: "fixture://govdao/docs/gov-105",
    docHash: "0x30e7b04dd160ab7aaaacefd2f85adb0d0417804c897b1b74840f6af612992e0b"
  }
];

export const offchainMotions = [
  {
    id: "OPS-22",
    title: "Approve partner onboarding pack",
    stage: "Document Review",
    auth: "Passkey",
    summary: "Operations and legal reviewers sign off before final DAO publication.",
    owner: "Legal Ops",
    nextStep: "Await final compliance sign-off"
  },
  {
    id: "OPS-24",
    title: "Regional meetup micro-budget",
    stage: "Delegate Approval",
    auth: "Wallet Signature",
    summary: "Fast off-chain motion with optional anchoring before the treasury request is minted.",
    owner: "Community Team",
    nextStep: "Anchor result and open treasury request if approved"
  }
];

export const treasurySnapshot = {
  custodian: "Treasury Timelock",
  balance: "128.4 ETH",
  perTransferCap: "25 ETH",
  dailyCap: "60 ETH",
  paused: false,
  reportingWindow: "Last 30 days"
};

export const treasuryMovements = [
  {
    id: "TRX-88",
    title: "Security retainer payout",
    direction: "Outflow",
    amount: "12.0 ETH",
    status: "Executed",
    counterparty: "Audit Collective",
    nextStep: "Attach the execution receipt to the monthly treasury report"
  },
  {
    id: "TRX-91",
    title: "Member dues sweep",
    direction: "Inflow",
    amount: "4.6 ETH",
    status: "Settled",
    counterparty: "Membership Contract",
    nextStep: "Reconcile the sweep against the registry snapshot"
  },
  {
    id: "TRX-93",
    title: "Community grants tranche",
    direction: "Outflow",
    amount: "8.5 ETH",
    status: "Queued",
    counterparty: "Grants Committee Safe",
    nextStep: "Wait for timelock release before execution"
  }
];

export const guardianStatus = {
  state: "Standby",
  threshold: "3-of-5",
  signers: "5 active signers",
  pauseWindow: "No active pause",
  lastDrill: "Quarterly drill completed 12d ago"
};

export const guardianEvents = [
  {
    id: "GRD-12",
    title: "Scheduled pause drill",
    severity: "Routine",
    status: "Completed",
    owner: "Security Desk",
    nextStep: "File the drill report into the workspace runbook"
  },
  {
    id: "GRD-15",
    title: "Signer rotation request",
    severity: "Elevated",
    status: "Pending",
    owner: "Security Council",
    nextStep: "Collect 3-of-5 signatures before the rotation executes"
  }
];

export const workspaceItems = [
  {
    id: "DOC-9",
    title: "Quarterly treasury narrative",
    type: "Document Room",
    owner: "Finance Ops",
    status: "Needs Review",
    nextStep: "Route to reviewers before publishing to members"
  },
  {
    id: "SUP-4",
    title: "Guardian incident drill",
    type: "Ops Runbook",
    owner: "Security Desk",
    status: "Scheduled",
    nextStep: "Run dry exercise with emergency signers"
  },
  {
    id: "ANA-3",
    title: "Participation trend digest",
    type: "Analytics Snapshot",
    owner: "Control Plane",
    status: "Ready",
    nextStep: "Share with governance leads and attach to next proposal brief"
  }
];

export const memberRoster = [
  {
    id: "MBR-001",
    address: "0xA1b2C3d4E5f6a7B8C9d0E1f2A3B4C5D6E7F8a9B0",
    displayName: "Security Council",
    role: "Guardian Delegate",
    status: "Active",
    joinedAt: "2024-01-15"
  },
  {
    id: "MBR-002",
    address: "0xD4e5F6a7B8c9D0e1F2a3B4c5D6e7F8a9B0C1d2E3",
    displayName: "Finance Working Group",
    role: "Treasury Steward",
    status: "Active",
    joinedAt: "2024-02-20"
  },
  {
    id: "MBR-003",
    address: "0xB9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e4F5a6B7c8",
    displayName: "Release Council",
    role: "Protocol Operator",
    status: "Active",
    joinedAt: "2024-03-10"
  },
  {
    id: "MBR-004",
    address: "0xE2f3A4b5C6d7E8f9A0b1C2d3E4f5A6b7C8d9E0f1",
    displayName: "Community Operations",
    role: "Delegate",
    status: "Active",
    joinedAt: "2024-04-05"
  }
];
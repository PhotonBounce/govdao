export const proposalFeed = [
  {
    id: "GOV-104",
    title: "Expand emergency guardian signer set",
    state: "Queued",
    source: "On-chain",
    eta: "11h",
    summary: "Adds two institutional signers and rotates the old threshold to 3-of-5.",
    owner: "Security Council",
    nextStep: "Wait for timelock expiry and executor confirmation"
  },
  {
    id: "GOV-105",
    title: "Treasury reporting cadence upgrade",
    state: "Voting",
    source: "Hybrid",
    eta: "2d",
    summary: "Moves monthly treasury reports into an anchored off-chain review flow with on-chain acceptance.",
    owner: "Finance Working Group",
    nextStep: "Collect final delegate votes and publish report template"
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
// Contract ABIs — kept in exact sync with the deployed Solidity in /contracts.
// These are the canonical signatures from contracts/interfaces/*.sol and the
// concrete contracts. The live (non-fixture) data paths call these directly,
// so any drift here breaks real on-chain operation.

export const GOVERNOR_ABI = [
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string metadataURI, bytes32 metadataHash) external returns (uint256)",
  "function castVote(uint256 proposalId, uint8 voteType) external",
  "function queue(uint256 proposalId) external",
  "function execute(uint256 proposalId) external",
  "function cancel(uint256 proposalId) external",
  "function getProposalState(uint256 proposalId) external view returns (uint8)",
  "function getProposal(uint256 proposalId) external view returns (tuple(uint256 id, address proposer, string metadataURI, bytes32 metadataHash, uint256 snapshotBlock, uint256 votingStart, uint256 votingEnd, uint256 forVotes, uint256 againstVotes, uint256 abstainVotes, bool executed, bool cancelled, bytes[] actions, address[] targets, uint256[] values))",
  "function hasVoted(uint256 proposalId, address account) external view returns (bool)",
  "function isQueued(uint256 proposalId) external view returns (bool)",
  "function quorumVotes(uint256 proposalId) external view returns (uint256)",
  "function votingDelay() external view returns (uint256)",
  "function votingPeriod() external view returns (uint256)",
  "function quorumNumerator() external view returns (uint256)",
  "function proposalCount() external view returns (uint256)",
  "event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string metadataURI)",
  "event VoteCast(uint256 indexed proposalId, address indexed voter, uint8 voteType, uint256 weight)",
  "event GovernorPaused(address indexed by)",
  "event GovernorUnpaused(address indexed by)",
] as const;

export const MEMBER_REGISTRY_ABI = [
  "function addMember(address account, uint8 role) external",
  "function removeMember(address account) external",
  "function setRole(address account, uint8 role) external",
  "function isMember(address account) external view returns (bool)",
  "function isMemberAt(address account, uint256 blockNumber) external view returns (bool)",
  "function getRole(address account) external view returns (uint8)",
  "function getRoleAt(address account, uint256 blockNumber) external view returns (uint8)",
  "function getMemberCount() external view returns (uint256)",
  "function getPastMemberCount(uint256 blockNumber) external view returns (uint256)",
  "function transferAdminRole(address newAdmin) external",
  "event MemberAdded(address indexed account, uint8 role)",
  "event MemberRemoved(address indexed account)",
  "event RoleChanged(address indexed account, uint8 oldRole, uint8 newRole)",
  "event AdminTransferred(address indexed previousAdmin, address indexed newAdmin)",
] as const;

export const TREASURY_ABI = [
  "function transferETH(address to, uint256 amount) external",
  "function transferERC20(address token, address to, uint256 amount) external",
  "function getBalance() external view returns (uint256)",
  "function getERC20Balance(address token) external view returns (uint256)",
  "function setSpendingCaps(uint256 perTransaction, uint256 perPeriod) external",
  "function pause() external",
  "function unpause() external",
  "event FundsTransferred(address indexed to, uint256 amount)",
  "event FundsReceived(address indexed from, uint256 amount)",
  "event ERC20Transferred(address indexed token, address indexed to, uint256 amount)",
  "event SpendingCapUpdated(uint256 perTransaction, uint256 perPeriod)",
  "event TreasuryPaused(address indexed by)",
  "event TreasuryUnpaused(address indexed by)",
] as const;

export const TIMELOCK_ABI = [
  "function queueAction(address target, uint256 value, bytes data) external returns (bytes32)",
  "function executeAction(address target, uint256 value, bytes data) external payable",
  "function cancelAction(bytes32 actionId) external",
  "function updateGovernor(address newGovernor) external",
  "function getDelay() external view returns (uint256)",
  "function isActionQueued(bytes32 actionId) external view returns (bool)",
  "function isActionReady(bytes32 actionId) external view returns (bool)",
  "event ActionQueued(bytes32 indexed actionId, address target, uint256 value, bytes data, uint256 executeAfter)",
] as const;

export const EMERGENCY_GUARDIAN_ABI = [
  "function proposePause() external returns (bytes32)",
  "function confirmPause(bytes32 actionHash) external",
  "function proposeUnpause() external returns (bytes32)",
  "function confirmUnpause(bytes32 actionHash) external",
  "function proposeCancelProposal(uint256 proposalId) external returns (bytes32)",
  "function confirmCancelProposal(bytes32 actionHash) external",
  "function getSigners() external view returns (address[])",
  "function isPaused() external view returns (bool)",
  "event GuardianActionProposed(bytes32 indexed actionHash, uint8 indexed kind, uint256 proposalId, address indexed proposer)",
  "event GuardianActionConfirmed(bytes32 indexed actionHash, address indexed signer, uint256 confirmationsRequired)",
  "event GuardianActionExecuted(bytes32 indexed actionHash, uint8 indexed kind, uint256 proposalId)",
] as const;

// VoteType enum from IGovernor: Against=0, For=1, Abstain=2
export const VOTE_SUPPORT = {
  against: 0,
  for: 1,
  abstain: 2,
} as const;

// Role enum from IMemberRegistry: NONE=0, MEMBER=1, PROPOSER=2, EXECUTOR=3, ADMIN=4, GUARDIAN=5
export const ROLE_ENUM = {
  none: 0,
  member: 1,
  proposer: 2,
  executor: 3,
  admin: 4,
  guardian: 5,
} as const;

export const ROLE_LABELS: Record<number, string> = {
  0: "None",
  1: "Member",
  2: "Proposer",
  3: "Executor",
  4: "Admin",
  5: "Guardian",
};

/** Map a free-text role (from an invite draft) to the on-chain Role enum value. */
export function roleNameToEnum(role: string): number {
  const key = role.trim().toLowerCase();
  if (key.includes("guardian")) return ROLE_ENUM.guardian;
  if (key.includes("admin")) return ROLE_ENUM.admin;
  if (key.includes("executor") || key.includes("steward")) return ROLE_ENUM.executor;
  if (key.includes("proposer") || key.includes("delegate") || key.includes("operator") || key.includes("lead")) return ROLE_ENUM.proposer;
  return ROLE_ENUM.member;
}

// ProposalState enum from IGovernor: Proposed, Voting, Defeated, Succeeded, Queued, Cancelled, Executed
export const PROPOSAL_STATE_LABELS: Record<number, string> = {
  0: "Proposed",
  1: "Voting",
  2: "Defeated",
  3: "Succeeded",
  4: "Queued",
  5: "Cancelled",
  6: "Executed",
};

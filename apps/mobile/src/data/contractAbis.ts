export const GOVERNOR_ABI = [
  "function castVote(uint256 proposalId, uint8 support) external returns (uint256)",
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) external returns (uint256)",
  "function state(uint256 proposalId) external view returns (uint8)",
  "function hasVoted(uint256 proposalId, address account) external view returns (bool)",
  "function proposalVotes(uint256 proposalId) external view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function votingPeriod() external view returns (uint256)",
  "function quorumNumerator() external view returns (uint256)",
  "function hashProposal(address[] targets, uint256[] values, bytes[] calldatas, bytes32 descriptionHash) external pure returns (uint256)",
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 voteStart, uint256 voteEnd, string description)"
] as const;

export const TREASURY_ABI = [
  "function balance() external view returns (uint256)",
  "function paused() external view returns (bool)",
  "function spendCapPerTx() external view returns (uint256)",
  "function executeSpend(address recipient, uint256 amount, string calldata purpose) external",
  "function pause() external",
  "function unpause() external",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
] as const;

export const MEMBER_REGISTRY_ABI = [
  "function isMember(address account) external view returns (bool)",
  "function getMemberRole(address account) external view returns (string)",
  "function memberCount() external view returns (uint256)",
  "function addMember(address account, string calldata role) external",
  "function removeMember(address account) external",
  "event MemberAdded(address indexed account, string role)",
  "event MemberRemoved(address indexed account)"
] as const;

export const EMERGENCY_GUARDIAN_ABI = [
  "function proposePause() external",
  "function confirmPause(bytes32 actionId) external",
  "function threshold() external view returns (uint256)",
  "function scheduleDrill(uint8 drillType, uint256 windowHours) external",
  "event PauseProposed(bytes32 indexed actionId, address indexed proposer)",
  "event PauseConfirmed(bytes32 indexed actionId, address indexed confirmer)",
  "event DrillScheduled(bytes32 indexed drillId, uint8 drillType, uint256 windowHours)"
] as const;

export const TIMELOCK_ABI = [
  "function schedule(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt, uint256 delay) external",
  "function execute(address target, uint256 value, bytes calldata data, bytes32 predecessor, bytes32 salt) external payable",
  "function getMinDelay() external view returns (uint256)",
  "function isOperation(bytes32 id) external view returns (bool)",
  "function isOperationReady(bytes32 id) external view returns (bool)",
  "event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay)"
] as const;

export const VOTE_SUPPORT = {
  against: 0,
  for: 1,
  abstain: 2,
} as const;

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IGovernor.sol";
import "./interfaces/IMemberRegistry.sol";
import "./interfaces/ITimelock.sol";

/**
 * @title Governor
 * @notice On-chain proposal lifecycle and voting engine.
 *         All vote tallying happens on-chain. No off-chain vote aggregation.
 *         Voting power = 1 member = 1 vote (equal weight, no token-weighted in v1).
 */
contract Governor is IGovernor {
    IMemberRegistry public memberRegistry;
    ITimelock public timelock;

    // --- Governance parameters (changeable only through governance) ---
    uint256 public votingDelay;    // blocks between proposal creation and voting start
    uint256 public votingPeriod;   // blocks for voting window
    uint256 public quorumNumerator; // percentage (e.g. 20 = 20%)
    uint256 public constant QUORUM_DENOMINATOR = 100;

    uint256 public proposalCount;
    mapping(uint256 => Proposal) private _proposals;
    mapping(uint256 => mapping(address => bool)) private _hasVoted;
    mapping(uint256 => bool) private _queued;
    uint256 public proposalGracePeriod; // blocks after voting end to queue (0 = no limit)

    address public guardian; // emergency cancel only
    address public bootstrapAdmin;
    bool public paused;

    modifier onlyGuardian() {
        require(msg.sender == guardian, "Governor: only guardian");
        _;
    }

    modifier onlyProposer() {
        IMemberRegistry.Role role = memberRegistry.getRole(msg.sender);
        require(
            role == IMemberRegistry.Role.PROPOSER ||
            role == IMemberRegistry.Role.ADMIN,
            "Governor: not a proposer"
        );
        _;
    }

    modifier onlyExecutor() {
        IMemberRegistry.Role role = memberRegistry.getRole(msg.sender);
        require(
            role == IMemberRegistry.Role.EXECUTOR ||
            role == IMemberRegistry.Role.ADMIN,
            "Governor: not an executor"
        );
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Governor: paused");
        _;
    }

    constructor(
        address _memberRegistry,
        address _timelock,
        address _guardian,
        uint256 _votingDelay,
        uint256 _votingPeriod,
        uint256 _quorumNumerator
    ) {
        require(_quorumNumerator <= 100, "Governor: quorum > 100%");
        memberRegistry = IMemberRegistry(_memberRegistry);
        timelock = ITimelock(_timelock);
        guardian = _guardian;
        votingDelay = _votingDelay;
        votingPeriod = _votingPeriod;
        quorumNumerator = _quorumNumerator;
        bootstrapAdmin = msg.sender;
    }

    // ========================
    // Proposal Lifecycle
    // ========================

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory metadataURI,
        bytes32 metadataHash
    ) external override onlyProposer whenNotPaused returns (uint256 proposalId) {
        require(targets.length > 0, "Governor: empty proposal");
        require(bytes(metadataURI).length > 0, "Governor: empty metadata URI");
        require(metadataHash != bytes32(0), "Governor: empty metadata hash");
        require(
            targets.length == values.length && targets.length == calldatas.length,
            "Governor: length mismatch"
        );

        proposalCount++;
        proposalId = proposalCount;

        Proposal storage p = _proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.metadataURI = metadataURI;
        p.metadataHash = metadataHash;
        p.snapshotBlock = block.number;
        p.votingStart = block.number + votingDelay;
        p.votingEnd = block.number + votingDelay + votingPeriod;
        p.targets = targets;
        p.values = values;
        p.actions = calldatas;

        emit ProposalCreated(proposalId, msg.sender, metadataURI);
    }

    function castVote(uint256 proposalId, VoteType voteType) external override whenNotPaused {
        Proposal storage p = _proposals[proposalId];
        require(p.id != 0, "Governor: proposal not found");
        require(memberRegistry.isMemberAt(msg.sender, p.snapshotBlock), "Governor: not eligible at snapshot");
        require(block.number >= p.votingStart, "Governor: voting not started");
        require(block.number <= p.votingEnd, "Governor: voting ended");
        require(!_hasVoted[proposalId][msg.sender], "Governor: already voted");

        _hasVoted[proposalId][msg.sender] = true;

        // Equal weight: 1 member = 1 vote
        uint256 weight = 1;

        if (voteType == VoteType.For) {
            p.forVotes += weight;
        } else if (voteType == VoteType.Against) {
            p.againstVotes += weight;
        } else {
            p.abstainVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, voteType, weight);
    }

    function queue(uint256 proposalId) external override whenNotPaused {
        require(getProposalState(proposalId) == ProposalState.Succeeded, "Governor: not succeeded");

        Proposal storage p = _proposals[proposalId];
        _queued[proposalId] = true;

        for (uint256 i = 0; i < p.targets.length; i++) {
            timelock.queueAction(p.targets[i], p.values[i], p.actions[i]);
        }

        emit ProposalQueued(proposalId);
    }

    function execute(uint256 proposalId) external override whenNotPaused onlyExecutor {
        require(getProposalState(proposalId) == ProposalState.Queued, "Governor: not queued");

        Proposal storage p = _proposals[proposalId];
        p.executed = true; // CEI: set before external calls

        for (uint256 i = 0; i < p.targets.length; i++) {
            timelock.executeAction(p.targets[i], p.values[i], p.actions[i]);
        }

        emit ProposalExecuted(proposalId);
    }

    function cancel(uint256 proposalId) external override {
        Proposal storage p = _proposals[proposalId];
        require(p.id != 0, "Governor: proposal not found");
        require(!p.executed, "Governor: already executed");
        require(!p.cancelled, "Governor: already cancelled");
        require(
            msg.sender == p.proposer || msg.sender == guardian,
            "Governor: not authorized to cancel"
        );

        p.cancelled = true;

        // Cancel queued timelock actions if proposal was queued
        if (_queued[proposalId]) {
            for (uint256 i = 0; i < p.targets.length; i++) {
                bytes32 actionId = keccak256(abi.encode(p.targets[i], p.values[i], p.actions[i]));
                if (timelock.isActionQueued(actionId)) {
                    timelock.cancelAction(actionId);
                }
            }
        }

        emit ProposalCancelled(proposalId);
    }

    // ========================
    // View Functions
    // ========================

    function getProposalState(uint256 proposalId) public view override returns (ProposalState) {
        Proposal storage p = _proposals[proposalId];
        require(p.id != 0, "Governor: proposal not found");

        if (p.cancelled) return ProposalState.Cancelled;
        if (p.executed) return ProposalState.Executed;
        if (block.number < p.votingStart) return ProposalState.Proposed;
        if (block.number <= p.votingEnd) return ProposalState.Voting;

        // Voting ended — check results
        uint256 totalVotes = p.forVotes + p.againstVotes + p.abstainVotes;
        uint256 quorumRequired = _quorumRequired(p);

        if (totalVotes < quorumRequired || p.forVotes <= p.againstVotes) {
            return ProposalState.Defeated;
        }

        // Check if proposal has been queued
        if (_queued[proposalId]) {
            return ProposalState.Queued;
        }

        // Grace period: expire unqueued proposals
        if (proposalGracePeriod > 0 && block.number > p.votingEnd + proposalGracePeriod) {
            return ProposalState.Defeated;
        }

        return ProposalState.Succeeded;
    }

    function getProposal(uint256 proposalId) external view override returns (Proposal memory) {
        require(_proposals[proposalId].id != 0, "Governor: proposal not found");
        return _proposals[proposalId];
    }

    function hasVoted(uint256 proposalId, address account) external view override returns (bool) {
        return _hasVoted[proposalId][account];
    }

    function isQueued(uint256 proposalId) external view override returns (bool) {
        return _queued[proposalId];
    }

    function quorumVotes(uint256 proposalId) external view override returns (uint256) {
        Proposal storage p = _proposals[proposalId];
        require(p.id != 0, "Governor: proposal not found");
        return _quorumRequired(p);
    }

    // ========================
    // Governance-Only Setters (called via timelock)
    // ========================

    function setVotingDelay(uint256 newDelay) external {
        require(msg.sender == address(timelock), "Governor: only via timelock");
        uint256 oldDelay = votingDelay;
        votingDelay = newDelay;
        emit VotingDelayUpdated(oldDelay, newDelay);
    }

    function setVotingPeriod(uint256 newPeriod) external {
        require(msg.sender == address(timelock), "Governor: only via timelock");
        require(newPeriod > 0, "Governor: zero period");
        uint256 oldPeriod = votingPeriod;
        votingPeriod = newPeriod;
        emit VotingPeriodUpdated(oldPeriod, newPeriod);
    }

    function setQuorum(uint256 newQuorum) external {
        require(msg.sender == address(timelock), "Governor: only via timelock");
        require(newQuorum <= 100, "Governor: quorum > 100%");
        uint256 oldQuorum = quorumNumerator;
        quorumNumerator = newQuorum;
        emit QuorumUpdated(oldQuorum, newQuorum);
    }

    function setGuardian(address newGuardian) external {
        require(msg.sender == address(timelock), "Governor: only via timelock");
        address oldGuardian = guardian;
        guardian = newGuardian;
        emit GuardianUpdated(oldGuardian, newGuardian);
    }

    function setProposalGracePeriod(uint256 newPeriod) external {
        require(msg.sender == address(timelock), "Governor: only via timelock");
        uint256 oldPeriod = proposalGracePeriod;
        proposalGracePeriod = newPeriod;
        emit ProposalGracePeriodUpdated(oldPeriod, newPeriod);
    }

    function setGuardianBootstrap(address newGuardian) external {
        require(msg.sender == bootstrapAdmin, "Governor: only bootstrap admin");
        guardian = newGuardian;
    }

    function finalizeBootstrap() external {
        require(
            msg.sender == bootstrapAdmin || msg.sender == address(timelock),
            "Governor: not authorized"
        );
        bootstrapAdmin = address(0);
    }

    event GovernorPaused(address indexed by);
    event GovernorUnpaused(address indexed by);

    function pause() external onlyGuardian {
        paused = true;
        emit GovernorPaused(msg.sender);
    }

    function unpause() external {
        require(msg.sender == guardian || msg.sender == address(timelock), "Governor: not authorized");
        paused = false;
        emit GovernorUnpaused(msg.sender);
    }

    function _memberCountAtSnapshot(Proposal storage proposal) internal view returns (uint256) {
        return memberRegistry.getPastMemberCount(proposal.snapshotBlock);
    }

    function _quorumRequired(Proposal storage p) internal view returns (uint256) {
        uint256 q = (_memberCountAtSnapshot(p) * quorumNumerator) / QUORUM_DENOMINATOR;
        return q == 0 ? 1 : q;
    }
}

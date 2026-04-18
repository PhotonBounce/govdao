// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IGovernor
 * @notice On-chain proposal lifecycle and voting. No off-chain vote tallying.
 */
interface IGovernor {
    enum ProposalState { Proposed, Voting, Defeated, Succeeded, Queued, Cancelled, Executed }
    enum VoteType { Against, For, Abstain }

    struct Proposal {
        uint256 id;
        address proposer;
        string metadataURI;       // IPFS/Arweave hash — content lives off-chain
        bytes32 metadataHash;     // keccak256 of metadata for integrity verification
        uint256 snapshotBlock;    // voting power frozen at this block
        uint256 votingStart;
        uint256 votingEnd;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        bool executed;
        bool cancelled;
        bytes[] actions;          // encoded calls to execute if passed
        address[] targets;
        uint256[] values;
    }

    event ProposalCreated(uint256 indexed proposalId, address indexed proposer, string metadataURI);
    event VoteCast(uint256 indexed proposalId, address indexed voter, VoteType voteType, uint256 weight);
    event ProposalQueued(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);
    event VotingDelayUpdated(uint256 oldDelay, uint256 newDelay);
    event VotingPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event QuorumUpdated(uint256 oldQuorum, uint256 newQuorum);
    event GuardianUpdated(address oldGuardian, address newGuardian);
    event ProposalGracePeriodUpdated(uint256 oldPeriod, uint256 newPeriod);

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory metadataURI,
        bytes32 metadataHash
    ) external returns (uint256 proposalId);

    function castVote(uint256 proposalId, VoteType voteType) external;
    function queue(uint256 proposalId) external;
    function execute(uint256 proposalId) external;
    function cancel(uint256 proposalId) external;
    function getProposalState(uint256 proposalId) external view returns (ProposalState);
    function getProposal(uint256 proposalId) external view returns (Proposal memory);
    function hasVoted(uint256 proposalId, address account) external view returns (bool);
    function isQueued(uint256 proposalId) external view returns (bool);
    function quorumVotes(uint256 proposalId) external view returns (uint256);
}

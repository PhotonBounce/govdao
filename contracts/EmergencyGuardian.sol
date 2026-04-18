// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Treasury.sol";
import "./Governor.sol";

/**
 * @title EmergencyGuardian
 * @notice Multi-sig emergency control. Can pause treasury and cancel proposals.
 *         CANNOT move funds. CANNOT bypass governance. Removable by governance.
 *
 *         Pause auto-expires after MAX_PAUSE_DURATION if not ratified.
 */
contract EmergencyGuardian {
    uint256 public constant MAX_PAUSE_DURATION = 72 hours;

    enum ActionKind {
        None,
        Pause,
        Unpause,
        CancelProposal
    }

    struct PendingAction {
        ActionKind kind;
        uint256 proposalId;
        bool executed;
    }

    address[] public signers;
    uint256 public threshold; // e.g. 3-of-5

    Treasury public treasury;
    Governor public governor;

    uint256 public pausedAt;

    mapping(bytes32 => mapping(address => bool)) public confirmations;
    mapping(bytes32 => uint256) public confirmationCount;
    mapping(bytes32 => PendingAction) public pendingActions;
    uint256 public nonce;

    event GuardianActionProposed(bytes32 indexed actionHash, ActionKind indexed kind, uint256 proposalId, address indexed proposer);
    event GuardianActionConfirmed(bytes32 indexed actionHash, address indexed signer, uint256 confirmationsRequired);
    event GuardianActionExecuted(bytes32 indexed actionHash, ActionKind indexed kind, uint256 proposalId);

    modifier onlySigner() {
        require(_isSigner(msg.sender), "Guardian: not a signer");
        _;
    }

    constructor(
        address[] memory _signers,
        uint256 _threshold,
        address _treasury,
        address _governor
    ) {
        require(_signers.length >= _threshold && _threshold > 0, "Guardian: bad threshold");
        for (uint256 i = 0; i < _signers.length; i++) {
            require(_signers[i] != address(0), "Guardian: zero signer");
            for (uint256 j = 0; j < i; j++) {
                require(_signers[i] != _signers[j], "Guardian: duplicate signer");
            }
        }
        signers = _signers;
        threshold = _threshold;
        treasury = Treasury(payable(_treasury));
        governor = Governor(_governor);
    }

    /// @notice Propose emergency pause. Needs threshold confirmations.
    function proposePause() external onlySigner returns (bytes32 actionHash) {
        actionHash = _createAction(ActionKind.Pause, 0, msg.sender);
        _maybeExecute(actionHash);
    }

    /// @notice Confirm a pending pause action
    function confirmPause(bytes32 actionHash) external onlySigner {
        _confirm(actionHash, msg.sender);
        _maybeExecute(actionHash);
    }

    function proposeUnpause() external onlySigner returns (bytes32 actionHash) {
        actionHash = _createAction(ActionKind.Unpause, 0, msg.sender);
        _maybeExecute(actionHash);
    }

    function confirmUnpause(bytes32 actionHash) external onlySigner {
        _confirm(actionHash, msg.sender);
        _maybeExecute(actionHash);
    }

    /// @notice Auto-expire: anyone can call to lift pause after MAX_PAUSE_DURATION
    function expirePause() external {
        require(pausedAt != 0, "Guardian: not paused");
        require(block.timestamp >= pausedAt + MAX_PAUSE_DURATION, "Guardian: pause not expired");
        treasury.unpause();
        governor.unpause();
        pausedAt = 0;
        emit GuardianActionExecuted(bytes32(0), ActionKind.Unpause, 0);
    }

    function proposeCancelProposal(uint256 proposalId) external onlySigner returns (bytes32 actionHash) {
        actionHash = _createAction(ActionKind.CancelProposal, proposalId, msg.sender);
        _maybeExecute(actionHash);
    }

    function confirmCancelProposal(bytes32 actionHash) external onlySigner {
        _confirm(actionHash, msg.sender);
        _maybeExecute(actionHash);
    }

    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function isPaused() external view returns (bool) {
        return treasury.paused();
    }

    // --- Internal ---

    function _executePause() internal {
        treasury.pause();
        governor.pause();
        pausedAt = block.timestamp;
    }

    function _executeUnpause() internal {
        treasury.unpause();
        governor.unpause();
        pausedAt = 0;
    }

    function _createAction(ActionKind kind, uint256 proposalId, address proposer) internal returns (bytes32 actionHash) {
        nonce++;
        actionHash = keccak256(abi.encode(kind, proposalId, nonce));
        pendingActions[actionHash] = PendingAction({ kind: kind, proposalId: proposalId, executed: false });
        confirmations[actionHash][proposer] = true;
        confirmationCount[actionHash] = 1;
        emit GuardianActionProposed(actionHash, kind, proposalId, proposer);
    }

    function _confirm(bytes32 actionHash, address signer) internal {
        PendingAction storage pending = pendingActions[actionHash];
        require(pending.kind != ActionKind.None, "Guardian: unknown action");
        require(!pending.executed, "Guardian: action executed");
        require(!confirmations[actionHash][signer], "Guardian: already confirmed");

        confirmations[actionHash][signer] = true;
        confirmationCount[actionHash]++;

        emit GuardianActionConfirmed(actionHash, signer, threshold);
    }

    function _maybeExecute(bytes32 actionHash) internal {
        PendingAction storage pending = pendingActions[actionHash];
        require(pending.kind != ActionKind.None, "Guardian: unknown action");
        if (pending.executed || confirmationCount[actionHash] < threshold) {
            return;
        }

        pending.executed = true;

        if (pending.kind == ActionKind.Pause) {
            _executePause();
        } else if (pending.kind == ActionKind.Unpause) {
            _executeUnpause();
        } else if (pending.kind == ActionKind.CancelProposal) {
            governor.cancel(pending.proposalId);
        }

        emit GuardianActionExecuted(actionHash, pending.kind, pending.proposalId);
    }

    function _isSigner(address account) internal view returns (bool) {
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == account) return true;
        }
        return false;
    }
}

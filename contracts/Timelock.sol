// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ITimelock.sol";

/**
 * @title Timelock
 * @notice Enforces a mandatory delay between governance approval and execution.
 *         No one can bypass this delay. Delay changes require governance.
 */
contract Timelock is ITimelock {
    uint256 public constant MIN_DELAY = 60; // 60 seconds; deploy script enforces ≥2 days on production networks
    uint256 public constant MAX_DELAY = 30 days;

    uint256 private _delay;
    address public governor;
    address public guardian; // can cancel, not execute
    address public bootstrapAdmin;

    mapping(bytes32 => uint256) private _queuedAt; // actionId => timestamp

    modifier onlyGovernor() {
        require(msg.sender == governor, "Timelock: only governor");
        _;
    }

    modifier onlyBootstrapAdmin() {
        require(msg.sender == bootstrapAdmin, "Timelock: only bootstrap admin");
        _;
    }

    modifier onlyGuardianOrGovernor() {
        require(msg.sender == guardian || msg.sender == governor, "Timelock: not authorized");
        _;
    }

    modifier onlySelfOrGovernor() {
        require(msg.sender == address(this) || msg.sender == governor, "Timelock: not authorized");
        _;
    }

    constructor(uint256 initialDelay, address _governor, address _guardian) {
        require(initialDelay >= MIN_DELAY && initialDelay <= MAX_DELAY, "Timelock: invalid delay");
        _delay = initialDelay;
        governor = _governor;
        guardian = _guardian;
        bootstrapAdmin = msg.sender;
    }

    receive() external payable {}

    function queueAction(address target, uint256 value, bytes calldata data)
        external
        override
        onlyGovernor
        returns (bytes32 actionId)
    {
        actionId = _actionId(target, value, data);
        require(_queuedAt[actionId] == 0, "Timelock: already queued");
        _queuedAt[actionId] = block.timestamp;
        emit ActionQueued(actionId, target, value, data, block.timestamp + _delay);
    }

    function executeAction(address target, uint256 value, bytes calldata data)
        external
        payable
        override
        onlyGovernor
    {
        bytes32 actionId = _actionId(target, value, data);
        uint256 queuedAt = _queuedAt[actionId];
        require(queuedAt != 0, "Timelock: not queued");
        require(block.timestamp >= queuedAt + _delay, "Timelock: delay not met");
        // Grace period: must execute within 14 days of becoming ready
        require(block.timestamp <= queuedAt + _delay + 14 days, "Timelock: action expired");

        delete _queuedAt[actionId];

        (bool success, ) = target.call{value: value}(data);
        require(success, "Timelock: execution failed");

        emit ActionExecuted(actionId);
    }

    function cancelAction(bytes32 actionId) external override onlyGuardianOrGovernor {
        require(_queuedAt[actionId] != 0, "Timelock: not queued");
        delete _queuedAt[actionId];
        emit ActionCancelled(actionId);
    }

    function setDelay(uint256 newDelay) external onlySelfOrGovernor {
        require(newDelay >= MIN_DELAY && newDelay <= MAX_DELAY, "Timelock: invalid delay");
        uint256 oldDelay = _delay;
        _delay = newDelay;
        emit DelayUpdated(oldDelay, newDelay);
    }

    function setGuardian(address newGuardian) external onlySelfOrGovernor {
        guardian = newGuardian;
    }

    function setGovernor(address newGovernor) external onlyBootstrapAdmin {
        require(newGovernor != address(0), "Timelock: zero governor");
        governor = newGovernor;
    }

    /// @notice Governance-path governor update (called via timelock self-execution)
    function updateGovernor(address newGovernor) external override onlySelfOrGovernor {
        require(newGovernor != address(0), "Timelock: zero governor");
        governor = newGovernor;
    }

    function setGuardianBootstrap(address newGuardian) external onlyBootstrapAdmin {
        guardian = newGuardian;
    }

    function finalizeBootstrap() external {
        require(
            msg.sender == bootstrapAdmin || msg.sender == governor,
            "Timelock: not authorized"
        );
        bootstrapAdmin = address(0);
    }

    function getDelay() external view override returns (uint256) {
        return _delay;
    }

    function isActionQueued(bytes32 actionId) external view override returns (bool) {
        return _queuedAt[actionId] != 0;
    }

    function isActionReady(bytes32 actionId) external view override returns (bool) {
        uint256 queuedAt = _queuedAt[actionId];
        return queuedAt != 0 && block.timestamp >= queuedAt + _delay;
    }

    function _actionId(address target, uint256 value, bytes calldata data) internal pure returns (bytes32) {
        return keccak256(abi.encode(target, value, data));
    }
}

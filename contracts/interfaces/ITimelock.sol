// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ITimelock
 * @notice Enforces execution delay on governance actions. No bypass.
 */
interface ITimelock {
    event ActionQueued(bytes32 indexed actionId, address target, uint256 value, bytes data, uint256 executeAfter);
    event ActionExecuted(bytes32 indexed actionId);
    event ActionCancelled(bytes32 indexed actionId);
    event DelayUpdated(uint256 oldDelay, uint256 newDelay);

    function queueAction(address target, uint256 value, bytes calldata data) external returns (bytes32 actionId);
    function executeAction(address target, uint256 value, bytes calldata data) external payable;
    function cancelAction(bytes32 actionId) external;
    function getDelay() external view returns (uint256);
    function isActionQueued(bytes32 actionId) external view returns (bool);
    function isActionReady(bytes32 actionId) external view returns (bool);
}

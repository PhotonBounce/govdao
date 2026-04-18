// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IMemberRegistry
 * @notice On-chain membership and role management. Source of truth for who can vote/propose/execute.
 */
interface IMemberRegistry {
    enum Role { NONE, MEMBER, PROPOSER, EXECUTOR, ADMIN, GUARDIAN }

    event MemberAdded(address indexed account, Role role);
    event MemberRemoved(address indexed account);
    event RoleChanged(address indexed account, Role oldRole, Role newRole);

    function addMember(address account, Role role) external;
    function removeMember(address account) external;
    function setRole(address account, Role role) external;
    function isMember(address account) external view returns (bool);
    function isMemberAt(address account, uint256 blockNumber) external view returns (bool);
    function getRole(address account) external view returns (Role);
    function getRoleAt(address account, uint256 blockNumber) external view returns (Role);
    function getMemberCount() external view returns (uint256);
    function getPastMemberCount(uint256 blockNumber) external view returns (uint256);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IMemberRegistry.sol";
import { Checkpoints } from "@openzeppelin/contracts/utils/structs/Checkpoints.sol";
import { SafeCast } from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
 * @title MemberRegistry
 * @notice On-chain source of truth for DAO membership and roles.
 *         No off-chain authority can override this registry.
 */
contract MemberRegistry is IMemberRegistry {
    using Checkpoints for Checkpoints.Trace208;

    address[] private _members;
    mapping(address => uint256) private _memberIndex; // 1-indexed for existence check
    mapping(address => Checkpoints.Trace208) private _roleCheckpoints;
    Checkpoints.Trace208 private _memberCountCheckpoints;

    address public governor; // only governor can mutate after init
    address public admin;    // bootstrap admin, must be revoked

    modifier onlyAdmin() {
        require(msg.sender == admin || msg.sender == governor, "MemberRegistry: not authorized");
        _;
    }

    modifier onlyGovernor() {
        require(msg.sender == governor, "MemberRegistry: only governor");
        _;
    }

    constructor(address _admin) {
        admin = _admin;
        // Admin is initial member with ADMIN role
        _addMember(_admin, Role.ADMIN);
    }

    /// @notice Set the governor address. Can only be called once by admin to hand off control.
    function setGovernor(address _governor) external {
        require(msg.sender == admin, "MemberRegistry: only admin");
        require(governor == address(0), "MemberRegistry: governor already set");
        governor = _governor;
    }

    /// @notice Revoke admin bootstrap power. Irreversible. Governance takes over.
    function revokeAdmin() external onlyGovernor {
        admin = address(0);
    }

    function addMember(address account, Role role) external override onlyAdmin {
        require(account != address(0), "MemberRegistry: zero account");
        require(role != Role.NONE, "MemberRegistry: invalid role");
        require(!isMember(account), "MemberRegistry: already member");
        _addMember(account, role);
    }

    function removeMember(address account) external override onlyAdmin {
        require(isMember(account), "MemberRegistry: not a member");
        _removeMember(account);
    }

    function setRole(address account, Role role) external override onlyAdmin {
        require(isMember(account), "MemberRegistry: not a member");
        require(role != Role.NONE, "MemberRegistry: invalid role");
        Role oldRole = getRole(account);
        _writeRoleCheckpoint(account, role);
        emit RoleChanged(account, oldRole, role);
    }

    function isMember(address account) public view override returns (bool) {
        return getRole(account) != Role.NONE;
    }

    function isMemberAt(address account, uint256 blockNumber) external view override returns (bool) {
        return getRoleAt(account, blockNumber) != Role.NONE;
    }

    function getRole(address account) public view override returns (Role) {
        return Role(_roleCheckpoints[account].latest());
    }

    function getRoleAt(address account, uint256 blockNumber) public view override returns (Role) {
        return Role(_roleCheckpoints[account].upperLookupRecent(SafeCast.toUint48(blockNumber)));
    }

    function getMemberCount() external view override returns (uint256) {
        return _memberCountCheckpoints.latest();
    }

    function getPastMemberCount(uint256 blockNumber) external view override returns (uint256) {
        return _memberCountCheckpoints.upperLookupRecent(SafeCast.toUint48(blockNumber));
    }

    function getMemberAt(uint256 index) external view returns (address) {
        require(index < _members.length, "MemberRegistry: out of bounds");
        return _members[index];
    }

    // --- Internal ---

    function _addMember(address account, Role role) internal {
        _members.push(account);
        _memberIndex[account] = _members.length; // 1-indexed
        _writeRoleCheckpoint(account, role);
        _memberCountCheckpoints.push(SafeCast.toUint48(block.number), SafeCast.toUint208(_members.length));
        emit MemberAdded(account, role);
    }

    function _removeMember(address account) internal {
        uint256 idx = _memberIndex[account] - 1;
        uint256 lastIdx = _members.length - 1;

        if (idx != lastIdx) {
            address lastMember = _members[lastIdx];
            _members[idx] = lastMember;
            _memberIndex[lastMember] = idx + 1;
        }
        _members.pop();
        delete _memberIndex[account];
        _writeRoleCheckpoint(account, Role.NONE);
        _memberCountCheckpoints.push(SafeCast.toUint48(block.number), SafeCast.toUint208(_members.length));
        emit MemberRemoved(account);
    }

    function _writeRoleCheckpoint(address account, Role role) internal {
        _roleCheckpoints[account].push(SafeCast.toUint48(block.number), SafeCast.toUint208(uint256(role)));
    }
}

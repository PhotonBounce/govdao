// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/ITreasury.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Treasury
 * @notice On-chain fund custody for the DAO. Only the Timelock (governance path)
 *         can authorize transfers. Guardian can pause but never withdraw.
 *         No hidden admin keys. No backdoors.
 */
contract Treasury is ITreasury, ReentrancyGuard {
    using SafeERC20 for IERC20;

    address public timelock;  // only address that can move funds
    address public guardian;  // can pause/unpause only
    address public bootstrapAdmin;

    bool public paused;

    uint256 public spendCapPerTx;
    uint256 public spendCapPerPeriod;
    uint256 public periodDuration;
    uint256 public currentPeriodStart;
    uint256 public spentThisPeriod;

    modifier onlyTimelock() {
        require(msg.sender == timelock, "Treasury: only timelock");
        _;
    }

    modifier onlyGuardian() {
        require(msg.sender == guardian, "Treasury: only guardian");
        _;
    }

    modifier onlyGuardianOrTimelock() {
        require(msg.sender == guardian || msg.sender == timelock, "Treasury: not authorized");
        _;
    }

    modifier onlyBootstrapAdmin() {
        require(msg.sender == bootstrapAdmin, "Treasury: only bootstrap admin");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Treasury: paused");
        _;
    }

    constructor(
        address _timelock,
        address _guardian,
        uint256 _spendCapPerTx,
        uint256 _spendCapPerPeriod,
        uint256 _periodDuration
    ) {
        require(_timelock != address(0), "Treasury: zero timelock");
        timelock = _timelock;
        guardian = _guardian;
        bootstrapAdmin = msg.sender;
        spendCapPerTx = _spendCapPerTx;
        spendCapPerPeriod = _spendCapPerPeriod;
        periodDuration = _periodDuration > 0 ? _periodDuration : 30 days;
        currentPeriodStart = block.timestamp;
    }

    receive() external payable {
        emit FundsReceived(msg.sender, msg.value);
    }

    function transferETH(address payable to, uint256 amount)
        external
        override
        onlyTimelock
        whenNotPaused
        nonReentrant
    {
        require(to != address(0), "Treasury: zero address");
        _enforceSpendingCaps(amount);
        (bool success, ) = to.call{value: amount}("");
        require(success, "Treasury: ETH transfer failed");
        emit FundsTransferred(to, amount);
    }

    function transferERC20(address token, address to, uint256 amount)
        external
        override
        onlyTimelock
        whenNotPaused
        nonReentrant
    {
        require(to != address(0), "Treasury: zero address");
        _enforceSpendingCaps(amount);
        IERC20(token).safeTransfer(to, amount);
        emit ERC20Transferred(token, to, amount);
    }

    function setSpendingCaps(uint256 perTransaction, uint256 perPeriod)
        external
        override
        onlyTimelock
    {
        spendCapPerTx = perTransaction;
        spendCapPerPeriod = perPeriod;
        emit SpendingCapUpdated(perTransaction, perPeriod);
    }

    function pause() external override onlyGuardianOrTimelock {
        paused = true;
        emit TreasuryPaused(msg.sender);
    }

    function unpause() external override onlyGuardianOrTimelock {
        paused = false;
        emit TreasuryUnpaused(msg.sender);
    }

    /// @notice Governance can replace guardian via timelock
    function setGuardian(address newGuardian) external onlyTimelock {
        guardian = newGuardian;
    }

    function setGuardianBootstrap(address newGuardian) external onlyBootstrapAdmin {
        guardian = newGuardian;
    }

    function finalizeBootstrap() external {
        require(
            msg.sender == bootstrapAdmin || msg.sender == timelock,
            "Treasury: not authorized"
        );
        bootstrapAdmin = address(0);
    }

    function getBalance() external view override returns (uint256) {
        return address(this).balance;
    }

    function getERC20Balance(address token) external view override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    // --- Internal ---

    function _enforceSpendingCaps(uint256 amount) internal {
        // Per-transaction cap
        if (spendCapPerTx > 0) {
            require(amount <= spendCapPerTx, "Treasury: exceeds per-tx cap");
        }

        // Per-period cap
        if (spendCapPerPeriod > 0) {
            if (block.timestamp >= currentPeriodStart + periodDuration) {
                // New period
                currentPeriodStart = block.timestamp;
                spentThisPeriod = 0;
            }
            require(spentThisPeriod + amount <= spendCapPerPeriod, "Treasury: exceeds period cap");
            spentThisPeriod += amount;
        }
    }
}

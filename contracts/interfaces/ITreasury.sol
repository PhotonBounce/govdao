// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title ITreasury
 * @notice On-chain fund custody. Only governance-approved paths can move assets.
 */
interface ITreasury {
    event FundsReceived(address indexed from, uint256 amount);
    event FundsTransferred(address indexed to, uint256 amount);
    event ERC20Transferred(address indexed token, address indexed to, uint256 amount);
    event SpendingCapUpdated(uint256 perTransaction, uint256 perPeriod);
    event TreasuryPaused(address indexed by);
    event TreasuryUnpaused(address indexed by);

    function transferETH(address payable to, uint256 amount) external;
    function transferERC20(address token, address to, uint256 amount) external;
    function getBalance() external view returns (uint256);
    function getERC20Balance(address token) external view returns (uint256);
    function setSpendingCaps(uint256 perTransaction, uint256 perPeriod) external;
    function pause() external;
    function unpause() external;
}

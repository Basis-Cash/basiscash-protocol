pragma solidity ^0.5.0;

interface IBasisBank {
    function depositSize(address account) external view returns (uint256);
    
    function lastDeposit(address account) external view returns (uint256);
    
    function withdraw(uint256 amount) external;
    
    function deposit(uint256 amount) external;

    event Deposit(address indexed from, uint256 value);
    event Withdraw(address indexed from, uint256 value);
    event DepositReward(address indexed from, uint256 value);
}
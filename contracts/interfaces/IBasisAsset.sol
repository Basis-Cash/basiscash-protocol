pragma solidity ^0.6.0;

interface IBasisAsset {
    function mint(address recipient, uint256 amount) external returns (bool);

    function burn(address from, uint256 amount) external returns (bool);
    
    function burnFrom(address from, uint256 amount) external returns (bool);

    function isOperator() external returns (bool);
    
    function operator() external view returns (address);
}

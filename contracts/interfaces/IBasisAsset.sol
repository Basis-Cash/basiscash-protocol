pragma solidity ^0.5.0;

interface IBasisAsset {
    function mint(address recipient, uint256 amount) external returns (bool);

    function burn(address from, uint256 amount) external returns (bool);
    
    function burnFrom(address from, uint256 amount) external returns (bool);
}

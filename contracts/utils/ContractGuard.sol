pragma solidity ^0.6.12;

contract ContractGuard {
    mapping(uint256 => mapping(address => bool)) private _status;

    modifier onlyOneBlock() {
        require(
            !_status[block.number][msg.sender],
            'ContractGuard: one block, one function'
        );

        _;

        _status[block.number][msg.sender] = true;
    }
}

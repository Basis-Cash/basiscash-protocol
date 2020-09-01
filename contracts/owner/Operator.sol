pragma solidity ^0.5.0;

import './Context.sol';
import './Ownable.sol';

contract Operator is Context, Ownable {
    address private _operator;

    event OperatorTransferred(
        address indexed previousOperator,
        address indexed newOperator
    );

    constructor() internal {
        _operator = _msgSender();
        emit OperatorTransferred(address(0), _operator);
    }

    function operator() public view returns (address) {
        return _operator;
    }
        
    modifier onlyOperator() {
        require(_operator == msg.sender, "operator: caller is not the operator");
        _;
    }

    function isOperator() public view returns (bool) {
        return _msgSender() == _operator;
    }
    
    function transferOperator(address newTreasury_) public onlyOwner {
        _transferOperator(newTreasury_);
    }

    function _transferOperator(address newOperator_) internal {
        require(
            newOperator_ != address(0),
            "operator: zero address given for new operator"
        );
        emit OperatorTransferred(address(0), newOperator_);
        _operator = newOperator_;
    }
}

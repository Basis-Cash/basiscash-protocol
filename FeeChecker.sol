pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';
import './owner/Operator.sol';
import './interfaces/IFeeChecker.sol';
import './interfaces/IOracle.sol';

contract FeeChecker is IFeeChecker, Operator {
    using SafeMath for uint256;

    IOracle public oracle;
    address public tokenAddress;
    uint256 tax_below_price = 1000000; //The value of $1 worth of Basis returned by the oracle ( 18 decimals, which is why we do oracle.consult(tokenAddress, 10 ** 18) )

    //If price < tax_below_price, sending Basis to addresses in feeList will have a fee
    mapping(address => bool) public feeList;

    //Addresses in noFeeList won't pay fees when sending Basis to addresses in feeList
    mapping(address => bool) public noFeeList; 

    constructor(address _tokenAddress) public {
        tokenAddress = _tokenAddress;
    }

    /* ========== VIEW FUNCTIONS ========== */

    function isTransferTaxed(address sender, address recipient) 
        external 
        override
        view
        returns (bool) 
    {
        return oracle.consult(tokenAddress, 10 ** 18) < tax_below_price && feeList[recipient] == true && noFeeList[sender] == false;
    }

    //Right now sender/recipient args aren't used, but they may be in the future
    function calculateFeeAmount(address sender, address recipient, uint256 amount) 
        external 
        override
        view 
        returns (uint256 feeAmount)
    {
        feeAmount = amount.mul(calculateTaxPercent()).div(tax_below_price.mul(tax_below_price));
    }

    //Tax = 1 - currPrice ** 2
    function calculateTaxPercent() 
        public 
        view 
        returns (uint256 taxPercent)
    {
        uint256 currPrice = oracle.consult(tokenAddress, 10 ** 18);
        taxPercent = tax_below_price.mul(tax_below_price) - currPrice.mul(currPrice);
    }

    /* ========== GOVERNANCE ========== */

    function addToFeeList(address _address) public onlyOperator {
        feeList[_address] = true;
    }

    function removeFromFeeList(address _address) public onlyOperator {
        feeList[_address] = false;
    }

    function addToNoFeeList(address _address) public onlyOperator {
        noFeeList[_address] = true;
    }

    function removeFromNoFeeList(address _address) public onlyOperator {
        noFeeList[_address] = false;
    }
    
    function setOracle(address _address) public onlyOperator {
        oracle = IOracle(_address);
    }
}

pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';
import './owner/Operator.sol';
import './interfaces/IFeeChecker.sol';
import './interfaces/IFeeDistributor.sol';

contract Cashv2 is ERC20Burnable, Operator {
    
    address public feeChecker; //Checks whether a transaction is taxed and returns the tax amount
    address public feeDistributor; //Handles distributing the tax

    /**
     * @notice Constructs the Basis Cash ERC-20 contract.
     */
    constructor() public ERC20('MIC2', 'MIC2') {
        // Mints 1 Basis Cash to contract creator for initial Uniswap oracle deployment.
        // Will be burned after oracle deployment
        _mint(msg.sender, 1 * 10**18);
    }

    //    function _beforeTokenTransfer(address from, address to, uint256 amount) internal virtual override {
    //        super._beforeTokenTransfer(from, to, amount);
    //        require(
    //            to != operator(),
    //            "basis.cash: operator as a recipient is not allowed"
    //        );
    //    }

    /**
     * @notice Operator mints basis cash to a recipient
     * @param recipient_ The address of recipient
     * @param amount_ The amount of basis cash to mint to
     * @return whether the process has been done
     */
    function mint(address recipient_, uint256 amount_)
        public
        onlyOperator
        returns (bool)
    {
        uint256 balanceBefore = balanceOf(recipient_);
        _mint(recipient_, amount_);
        uint256 balanceAfter = balanceOf(recipient_);

        return balanceAfter > balanceBefore;
    }

    function burn(uint256 amount) public override onlyOperator {
        super.burn(amount);
    }

    function burnFrom(address account, uint256 amount)
        public
        override
        onlyOperator
    {
        super.burnFrom(account, amount);
    }
    
    function _transfer(address sender, address recipient, uint256 amount) 
        internal 
        override 
    {
        if (amount > 0) {
            if(IFeeChecker(feeChecker).isTransferTaxed(sender, recipient)) {
                uint256 feeAmount = IFeeChecker(feeChecker).calculateFeeAmount(sender, recipient, amount);
                uint256 transferToAmount = amount.sub(feeAmount);

                super._transfer(sender, recipient, transferToAmount);

                if(feeAmount > 0) {
                    super._transfer(sender, feeDistributor, feeAmount);
                    IFeeDistributor(feeDistributor).addFee(feeAmount);
                }
            }
            else {
                super._transfer(sender, recipient, amount);
            }
        }
        else {
            super._transfer(sender, recipient, amount);
        }
    }

    function setFeeCheckerAddress(address _address) public onlyOperator {
        feeChecker = _address;
    }

    function setFeeDistributorAddress(address _address) public onlyOperator {
        feeDistributor = _address;
    }
}

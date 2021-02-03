pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';
import './owner/Operator.sol';
import './interfaces/IFeeChecker.sol';
import './interfaces/IFeeDistributor.sol';

contract Cash is ERC20Burnable, Operator {
    
    address public feeChecker; //Checks whether a transaction is taxed and returns the remaining amount and tax
    address public feeDistributor; //Handles distributing the tax

    /**
     * @notice Constructs the Basis Cash ERC-20 contract.
     */
    constructor() public ERC20('MIC', 'MIC') {
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
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        if (amount > 0) {
            _beforeTokenTransfer(sender, recipient, amount);
            _balances[sender] = _balances[sender].sub(amount, "ERC20: transfer amount exceeds balance");

            if(feeChecker.isTransferTaxed(sender, recipient)) {
                uint256 feeAmount = IFeeChecker(feeChecker).calculateFeeAmount(sender, recipient, amount);
                uint256 transferToAmount = amount.sub(feeAmount);

                require(transferToAmount.add(feeAmount) == amount, "transferToAmount + feeAmount != amount");

                _balances[recipient] = _balances[recipient].add(transferToAmount);
                emit Transfer(sender, recipient, transferToAmount);

                if(feeAmount > 0) {
                    _balances[feeDistributor] = _balances[feeDistributor].add(feeAmount);
                    emit Transfer(sender, feeDistributor, feeAmount);
                    IFeeDistributor(feeDistributor).addFee(feeAmount);
                }
            }
            else {
                _balances[recipient] = _balances[recipient].add(amount);
                emit Transfer(sender, recipient, amount);
            }
        }
        else {
            emit Transfer(sender, recipient, amount);
        }
    }

    function setFeeCheckerAddress(address _address) public onlyOperator {
        feeChecker = _address;
    }

    function setFeeDistributorAddress(address _address) public onlyOperator {
        feeDistributor = _address;
    }
}

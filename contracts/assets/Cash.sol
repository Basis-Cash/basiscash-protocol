// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {
    ERC20,
    ERC20Burnable
} from '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';

import {Operator} from '../access/Operator.sol';

contract Cash is ERC20Burnable, Operator {
    /**
     * @notice Constructs the Basis Cash ERC-20 contract.
     */
    constructor() ERC20('BAC', 'BAC') {
        // Mints 1 Basis Cash to contract creator for initial Uniswap oracle deployment.
        // Will be burned after oracle deployment
        _mint(_msgSender(), 1 * 10**18);
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
}

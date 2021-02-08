// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import {
    ERC20,
    ERC20Burnable
} from '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';

import {Operator} from '../access/Operator.sol';

contract ShareV2 is ERC20Burnable, Operator {
    /**
     * @notice Constructs the Basis Cash ERC-20 contract.
     */
    constructor() ERC20('BASv2', 'BASv2') {}

    /**
     * @notice Operator mints basis cash to a recipient
     * @param recipient_ The address of recipient
     * @param amount_ The amount of basis cash to mint to
     */
    function mint(address recipient_, uint256 amount_)
        public
        onlyOperator
        returns (bool)
    {
        uint256 balanceBefore = balanceOf(recipient_);
        _mint(recipient_, amount_);
        uint256 balanceAfter = balanceOf(recipient_);
        return balanceAfter >= balanceBefore;
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

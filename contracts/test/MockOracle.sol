pragma solidity ^0.6.0;

import '@openzeppelin/contracts/math/SafeMath.sol';

import '../interfaces/IOracle.sol';

contract MockOracle is IOracle {
    using SafeMath for uint256;

    uint256 public price;
    bool public error;

    function setPrice(uint256 _price) public {
        price = _price;
    }

    function setRevert(bool _error) public {
        error = _error;
    }

    function update() external override {
        require(!error, 'Oracle: mocked error');
        emit Updated(0, 0);
    }

    function consult(address, uint256 amountIn)
        external
        override
        view
        returns (uint256)
    {
        return price.mul(amountIn).div(1e18);
    }

    event Updated(uint256 price0CumulativeLast, uint256 price1CumulativeLast);
}

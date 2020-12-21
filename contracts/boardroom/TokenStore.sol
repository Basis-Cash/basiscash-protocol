pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC20/SafeERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

contract TokenStore is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public token;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    constructor(address _token) public {
        token = IERC20(_token);
    }

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function deposit(address owner, uint256 amount) public onlyOwner {
        _totalSupply = _totalSupply.add(amount);
        _balances[owner] = _balances[owner].add(amount);
        token.safeTransferFrom(owner, address(this), amount);
    }

    function withdraw(address owner, uint256 amount) public onlyOwner {
        uint256 balance = _balances[owner];
        require(
            balance >= amount,
            'TokenStore: withdraw request greater than deposit amount'
        );
        _totalSupply = _totalSupply.sub(amount);
        _balances[owner] = balance.sub(amount);
        token.safeTransfer(owner, amount);
    }
}

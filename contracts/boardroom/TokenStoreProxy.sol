pragma solidity ^0.6.0;

import {ITokenStore} from './ITokenStore.sol';
import {TokenStore} from './TokenStore.sol';

abstract contract TokenStoreProxy is ITokenStore {
    /* ========== EVENTS ========== */

    event TokenStoreChanged(
        address indexed operator,
        address oldTokenStore,
        address newTokenStore
    );

    /* ========== STATE VARIABLES ========== */

    address public tokenStore;

    /* ========== VIEW FUNCTIONS ========== */

    function totalSupply() public view override returns (uint256) {
        return TokenStore(tokenStore).totalSupply();
    }

    function balanceOf(address account) public view override returns (uint256) {
        return TokenStore(tokenStore).balanceOf(account);
    }

    /* ========== MUTATIVE FUNCTIONS ========== */

    // gov
    function setTokenStore(address newTokenStore) public virtual {
        address oldTokenStore = tokenStore;
        tokenStore = newTokenStore;
        emit TokenStoreChanged(msg.sender, oldTokenStore, newTokenStore);
    }

    // logic
    function stake(uint256 amount) public virtual override {
        (bool success, bytes memory reason) =
            tokenStore.delegatecall(
                abi.encodeWithSignature('stake(uint256)', amount)
            );
        require(success, string(reason));
    }

    function withdraw(uint256 amount) public virtual override {
        (bool success, bytes memory reason) =
            tokenStore.delegatecall(
                abi.encodeWithSignature('withdraw(uint256)', amount)
            );
        require(success, string(reason));
    }
}

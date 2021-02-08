// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

contract MockPool {
    event Updated(uint256 indexed _pid);

    address[] public tokens;
    mapping(address => uint256) public index;

    function addPool(address _token) public {
        uint256 i = tokens.length;
        tokens.push(_token);
        index[_token] = i;
    }

    function update(uint256 _pid) public {
        emit Updated(_pid);
    }
}

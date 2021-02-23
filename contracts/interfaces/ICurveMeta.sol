pragma solidity >=0.6.0;

interface ICurveMeta {
    //For metapools: 0 = the token (i.e. Frax, MIC, etc), 1 = DAI, 2 = USDC, 3 = USDT
    function add_liquidity(address _pool, uint256[4] calldata _deposit_amounts, uint256 _min_mint_amount) external returns (uint256);

    function calc_token_amount(address _pool, uint256[] calldata _amounts, bool _is_deposit) external returns (uint256);

    function calc_withdraw_one_coin(address _pool, uint256 _token_amount, uint256 i) external returns (uint256);
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

address constant ETHEREUM_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

library TokenBalance {
    // This function can be internal only, but for the example it is used as an external function.
    function thisBalance(address token) external view returns (uint256) {
        return
            token == ETHEREUM_ADDRESS
                ? address(this).balance
                : IERC20(token).balanceOf(address(this));
    }
}

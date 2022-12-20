// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./libs/TokenBalance.sol";

contract ERC20Mock is ERC20 {
    using TokenBalance for address;

    constructor(
        string memory name,
        string memory symbol,
        uint8 decimalPlaces
    ) ERC20(name, symbol) {}

    function mint(address to, uint256 _amount) public {
        _mint(to, _amount);
    }

    function burn(address to, uint256 _amount) public {
        _burn(to, _amount);
    }

    function useLib(address token) external view returns(uint256) {
        return token.thisBalance();
    }
}

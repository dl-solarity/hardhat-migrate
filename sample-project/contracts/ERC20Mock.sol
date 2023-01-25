// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

// Include this import to this file to build the artifact for the deployment script.
import "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "./libs/TokenBalance.sol";

contract ERC20Mock is ERC20Upgradeable {
    using TokenBalance for address;

    function initialize(string memory name_, string memory symbol_) external initializer {
        __ERC20_init(name_, symbol_);
    }

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

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

contract Contract {}

contract ContractWithPayableConstructor {
    constructor() payable {}
}

contract ContractWithConstructorArguments {
    string public name;

    constructor(string memory _name) {
        name = _name;
    }
}

contract ContractWithExternalLibrary {
    function lib() external returns (uint256) {
        return Library1.lib();
    }

    function lib2() external returns (uint256) {
        return Library2.lib();
    }
}

library Library1 {
    function lib() external pure returns (uint256) {
        return 1;
    }
}

library Library2 {
    function lib() external pure returns (uint256) {
        return 2;
    }
}

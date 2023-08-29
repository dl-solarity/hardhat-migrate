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

library Library {
    function lib() external pure {}
}

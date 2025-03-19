// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

contract PayableConstructor {
    constructor() payable {}
}

interface IConstructorWithArguments {
    function value() external view returns (uint256);
}

contract ConstructorWithArguments is IConstructorWithArguments {
    uint256 public value;

    constructor(uint256 _value) {
        value = _value;
    }
}

contract PayableReceive {
    event Received(address, uint256);

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function pay() external payable {
        emit Received(msg.sender, msg.value);
    }
}

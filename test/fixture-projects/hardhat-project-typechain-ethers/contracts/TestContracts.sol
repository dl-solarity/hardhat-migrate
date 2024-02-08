// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PayableConstructor {
    constructor() payable {}
}

contract ConstructorWithArguments {
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

// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

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
}

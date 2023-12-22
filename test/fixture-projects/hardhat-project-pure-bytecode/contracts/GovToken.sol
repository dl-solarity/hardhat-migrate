// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ERC20Votes, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

import {VotingPowerLib} from "./libs/VotingPowerLib.sol";
import {TimestampClockLib} from "./libs/TimestampClockLib.sol";

/**
* @title GovToken
*
* @notice This is an ERC20 token that includes vote delegation.
*         It is intentionally designed with added complexity for testing purposes.
*/
contract GovToken is ERC20Votes, Ownable {
    using VotingPowerLib for uint256;

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) EIP712(name_, version()) Ownable(msg.sender) {
        _mint(msg.sender, 1000000);
    }

    function decimals() public pure override returns (uint8) {
        return 3;
    }

    function version() public pure returns (string memory) {
        return "1";
    }

    function mint(address to_, uint256 amount_) external onlyOwner {
        _mint(to_, amount_);
    }

    function burn(address from_, uint256 amount_) external onlyOwner {
        _burn(from_, amount_);
    }

    function getUserVotingPower(address account_) public view returns (uint256) {
        return getVotes(account_).calculateUserVotingPower(decimals());
    }

    function getPastUserVotingPower(address account_, uint256 timestamp_) public view returns (uint256) {
        return getPastVotes(account_, timestamp_).calculateUserVotingPower(decimals());
    }

    function getVotingPowerThreshold() public view returns (uint256) {
        return _getTotalSupply().calculateVotingPowerThreshold(decimals());
    }

    function getPastVotingPowerThreshold(uint256 timestamp_) public view returns (uint256) {
        return getPastTotalSupply(timestamp_).calculateVotingPowerThreshold(decimals());
    }

    function clock() public view override returns (uint48) {
        return TimestampClockLib.clock();
    }

    function CLOCK_MODE() public view override  returns (string memory) {
        return TimestampClockLib.CLOCK_MODE();
    }
}

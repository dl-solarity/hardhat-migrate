// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/math/Math.sol";

library VotingPowerLib {
    using Math for *;

    function calculateUserVotingPower(uint256 tokenAmount_, uint8 decimals_) external pure returns (uint256) {
        uint256 oneToken_ = 10 ** decimals_;

        if (tokenAmount_ <= oneToken_) {
            return 0;
        }

        return (tokenAmount_ / oneToken_).log2();
    }

    function calculateVotingPowerThreshold(uint256 totalSupply_, uint8 decimals_) external pure returns (uint256) {
        uint256 oneToken_ = 10 ** decimals_;

        if (totalSupply_ <= oneToken_) {
            return 0;
        }

        return (totalSupply_ / oneToken_).log10();
    }
}

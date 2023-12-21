// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import {Time} from "@openzeppelin/contracts/utils/types/Time.sol";
import {Votes} from "@openzeppelin/contracts/governance/utils/Votes.sol";

library TimestampClockLib {
    using Time for *;

    function clock() public view returns (uint48) {
        return Time.timestamp();
    }

    function CLOCK_MODE() public view returns (string memory) {
        if (clock() != Time.timestamp()) {
            revert Votes.ERC6372InconsistentClock();
        }
        return "mode=timestamp";
    }
}

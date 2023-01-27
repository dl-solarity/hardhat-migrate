import "hardhat/types/config";

import { MigrateConfig, MigrateUserConfig } from "./types";
import { EtherscanConfig, EtherscanUserConfig } from "@nomiclabs/hardhat-etherscan/src/types";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    migrate: MigrateConfig;
    etherscan: EtherscanConfig;
  }

  interface HardhatUserConfig {
    migrate?: MigrateUserConfig;
    etherscan?: EtherscanUserConfig;
  }
}

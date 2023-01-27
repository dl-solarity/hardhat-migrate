import "hardhat/types/config";

import { DlDeployConfig, DlDeployUserConfig } from "./types";
import { EtherscanConfig, EtherscanUserConfig } from "@nomiclabs/hardhat-etherscan/src/types";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    migrate: DlDeployConfig;
    etherscan: EtherscanConfig;
  }

  interface HardhatUserConfig {
    migrate?: DlDeployUserConfig;
    etherscan?: EtherscanUserConfig;
  }
}

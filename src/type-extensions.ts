import "ethers";
import "hardhat/types/config";
import "hardhat/types/hre";

import {HardhatEthers} from "@nomicfoundation/hardhat-ethers/types"

import { MigrateUserConfig, MigrateConfig } from "./types/index.js";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    migrate?: MigrateUserConfig;
  }

  interface HardhatConfig {
    migrate: MigrateConfig;
  }
}

declare module "ethers" {
  interface ContractTransaction {
    customData: any & { txName?: string };
  }
}

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

declare module "hardhat/types/network" {
  interface NetworkConnection<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // -- the ChainTypeT must be declared in the interface but in this scenario it's not used
    ChainTypeT extends ChainType | string = DefaultChainType,
  > {
    ethers: HardhatEthers;
  }
}

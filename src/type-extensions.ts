import "ethers";
import "hardhat/types/config";
import "hardhat/types/runtime";

import { DeepPartial, MigrateConfig } from "./types/migrations";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    migrate: MigrateConfig;
  }

  interface HardhatUserConfig {
    migrate?: DeepPartial<MigrateConfig>;
  }
}

declare module "ethers" {
  interface ContractTransaction {
    customData: any & { txName?: string };
  }
}

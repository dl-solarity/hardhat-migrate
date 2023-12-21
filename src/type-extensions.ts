import "ethers";
import "hardhat/types/config";
import "hardhat/types/runtime";

import { MigrateConfig } from "./types/migrations";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    migrate: MigrateConfig;
  }

  interface HardhatUserConfig {
    migrate?: Partial<MigrateConfig>;
  }
}

declare module "ethers" {
  interface ContractTransaction {
    customData: any & { txName?: string };
  }
}

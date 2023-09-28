import "hardhat/types/config";
import "hardhat/types/runtime";

import { Migrator } from "./migrator/migrator";

import { MigrateConfig } from "./types/migrations";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    migrate: MigrateConfig;
  }

  interface HardhatUserConfig {
    migrate?: Partial<MigrateConfig>;
  }
}

declare module "hardhat/types/runtime" {
  export interface HardhatRuntimeEnvironment {
    migrator: Migrator;
  }
}

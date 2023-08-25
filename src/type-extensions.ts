import "hardhat/types/config";

import { MigrateConfig } from "./types/migrations";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    migrate: MigrateConfig;
  }

  interface HardhatUserConfig {
    migrate?: Partial<MigrateConfig>;
  }
}

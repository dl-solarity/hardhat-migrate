import "hardhat/types/config";

import { DlDeployConfig, DlDeployUserConfig } from "./types";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    hardhat_migrate?: DlDeployUserConfig;
  }

  interface HardhatConfig {
    hardhat_migrate: DlDeployConfig;
  }
}

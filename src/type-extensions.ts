import "hardhat/types/config";

import { DlDeployConfig, DlDeployUserConfig } from "./types";

declare module "hardhat/types/config" {
  interface HardhatUserConfig {
    migrate?: DlDeployUserConfig;
  }

  interface HardhatConfig {
    migrate: DlDeployConfig;
  }
}

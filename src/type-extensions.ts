import "hardhat/types/config";

import { DlDeployConfig, DlDeployUserConfig } from "./types";

declare module "hardhat/types/config" {
  interface HardhatConfig {
    migrate: DlDeployConfig;
  }

  interface HardhatUserConfig {
    migrate?: DlDeployUserConfig;
  }
}

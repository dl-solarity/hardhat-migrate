import "hardhat/types/config";

import { DlDeployConfig, DlDeployUserConfig } from "./types";

declare module "hardhat/types/config" {
    interface HardhatUserConfig {
        deploy?: DlDeployUserConfig;
    }

    interface HardhatConfig {
        deploy: DlDeployConfig;
    }
}

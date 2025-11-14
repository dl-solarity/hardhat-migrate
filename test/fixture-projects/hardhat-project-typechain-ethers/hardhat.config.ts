import type { HardhatUserConfig } from "hardhat/config";

import config from "../hardhat.config.js";

const defaultConfig: HardhatUserConfig = {
  ...config,
  typechain: {
    outDir: `typechain-types`,
  },
};

export default defaultConfig;

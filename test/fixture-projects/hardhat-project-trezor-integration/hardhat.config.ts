import type { HardhatUserConfig } from "hardhat/config";

import config from "../hardhat.config.js";

const defaultConfig: HardhatUserConfig = {
  ...config,
  typechain: {
    outDir: `typechain-types`,
  },
  migrate: {
    trezorWallet: {
      enabled: true,
      mnemonicIndex: 0,
    },
  },
};

export default defaultConfig;

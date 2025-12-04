import * as dotenv from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";

import config from "../hardhat.config.js";

dotenv.config();

const defaultConfig: HardhatUserConfig = {
  ...config,
  typechain: {
    outDir: `typechain-types`,
  },
  migrate: {
    castWallet: {
      account: "test-7",
      passwordFile: "test-0.pwd",
    },
  },
};

export default defaultConfig;

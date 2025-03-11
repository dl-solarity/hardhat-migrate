import { HardhatUserConfig } from "hardhat/config";

import "@typechain/hardhat";

import config from "../hardhat.config";

import * as dotenv from "dotenv";
dotenv.config();

const defaultConfig: HardhatUserConfig = {
  ...config,
  typechain: {
    outDir: `typechain-types`,
    target: "ethers-v6",
  },
  migrate: {
    castWallet: {
      enabled: true,
      account: "test-7",
      passwordFile: "test-0.pwd",
    },
  },
};

export default defaultConfig;

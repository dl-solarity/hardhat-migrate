import { HardhatUserConfig } from "hardhat/config";

import "@typechain/hardhat";

import config from "../hardhat.config";

const defaultConfig: HardhatUserConfig = {
  ...config,
  typechain: {
    outDir: `typechain-types`,
    target: "ethers-v6",
  },
  migrate: {
    trezorWallet: {
      enabled: true,
      mnemonicIndex: 0,
    },
  },
};

export default defaultConfig;

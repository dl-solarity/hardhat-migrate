import { HardhatUserConfig } from "hardhat/config";

import "@nomiclabs/hardhat-truffle5";

import "@typechain/hardhat";

import config from "../hardhat.config";

const defaultConfig: HardhatUserConfig = {
  ...config,
  typechain: {
    outDir: `typechain-types`,
    target: "truffle-v5",
    alwaysGenerateOverloads: true,
    discriminateTypes: true,
  },
};

export default defaultConfig;

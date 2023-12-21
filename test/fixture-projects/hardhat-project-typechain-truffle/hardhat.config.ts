import { HardhatUserConfig } from "hardhat/config";

import "@nomiclabs/hardhat-truffle5";

import config from "../hardhat.config";

const defaultConfig: HardhatUserConfig = {
  ...config,
};

export default defaultConfig;

import { HardhatUserConfig } from "hardhat/config";

import config from "../hardhat.config";

import "../../../src";

const defaultConfig: HardhatUserConfig = {
  ...config,
  migrate: {
    pathToMigrations: "~/deploy",
  },
};

export default defaultConfig;

import { HardhatUserConfig } from "hardhat/config";

import config from "../hardhat.config";

import "../../../src";

const defaultConfig: HardhatUserConfig = {
  ...config,
  migrate: {
    from: 1,
    to: 5,
    only: 2,
    skip: 1,
    wait: 2,
    verify: true,
    verifyParallel: 4,
    verifyAttempts: 5,
    pathToMigrations: "./deploy/",
    force: true,
    continue: true,
  },
};

export default defaultConfig;

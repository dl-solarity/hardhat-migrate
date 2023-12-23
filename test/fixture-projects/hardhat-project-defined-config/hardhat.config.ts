import { HardhatUserConfig } from "hardhat/config";

import config from "../hardhat.config";

import "../../../src";

const defaultConfig: HardhatUserConfig = {
  ...config,
  migrate: {
    from: 1,
    to: 3,
    only: 2,
    skip: 4,
    wait: 2,
    verify: true,
    verifyParallel: 12,
    verifyAttempts: 32,
    pathToMigrations: "./path-to-deploy",
    force: true,
    continue: true,
    transactionStatusCheckInterval: 4000,
  },
};

export default defaultConfig;

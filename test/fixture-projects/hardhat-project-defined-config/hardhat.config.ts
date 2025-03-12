import { HardhatUserConfig } from "hardhat/config";

import config from "../hardhat.config";

import "../../../src";

const defaultConfig: HardhatUserConfig = {
  ...config,
  migrate: {
    filter: {
      from: 1,
      to: 3,
      only: 2,
      skip: 4,
    },
    verification: {
      verify: true,
      verificationDelay: 5000,
      verifyParallel: 12,
      verifyAttempts: 32,
    },
    paths: {
      pathToMigrations: "./path-to-deploy",
      namespace: "",
    },
    execution: {
      force: true,
      continue: true,
      wait: 2,
      transactionStatusCheckInterval: 4000,
      withoutCLIReporting: false,
    },
    castWallet: {},
    trezorWallet: {
      enabled: false,
      mnemonicIndex: 0,
    },
  },
};

export default defaultConfig;

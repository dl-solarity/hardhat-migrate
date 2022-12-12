import { ConfigExtender } from "hardhat/types";

export const deployConfigExtender: ConfigExtender = (resolvedConfig, config) => {
  const defaultConfig = {
    from: -1,
    to: -1,
    only: -1,
    skip: -1,
    confirmations: 0,
    verify: false,
    pathToMigrations: "./deploy",
    skipVerificationErrors: ["already verified"],
    verificationAttempts: 1,
  };

  if (config.migrate !== undefined) {
    const { cloneDeep } = require("lodash");
    const customConfig = cloneDeep(config.migrate);

    resolvedConfig.migrate = { ...defaultConfig, ...customConfig };
  } else {
    resolvedConfig.migrate = defaultConfig;
  }
};

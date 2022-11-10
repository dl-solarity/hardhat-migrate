import { ConfigExtender } from "hardhat/types";

export const deployConfigExtender: ConfigExtender = (resolvedConfig, config) => {
  const defaultConfig = {
    confirmations: 1,
    verify: true,
    pathToMigrations: "./migrations",
  };

  if (config.hardhat_migrate !== undefined) {
    const { cloneDeep } = require("lodash");
    const customConfig = cloneDeep(config.hardhat_migrate);

    resolvedConfig.hardhat_migrate = { ...defaultConfig, ...customConfig };
  } else {
    resolvedConfig.hardhat_migrate = defaultConfig;
  }
};

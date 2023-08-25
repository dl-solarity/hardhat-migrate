import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { ConfigExtender } from "hardhat/types";
import { isAbsolute } from "path";
import { pluginName } from "./constants";
import { MigrateConfig } from "./types/migrations";

export const migrateConfigExtender: ConfigExtender = (resolvedConfig, config) => {
  const defaultConfig: MigrateConfig = {
    from: -1,
    to: -1,
    only: -1,
    skip: -1,
    confirmations: 0,
    verify: false,
    attempts: 0,
    pathToMigrations: "./deploy",
    skipVerificationErrors: ["already verified"],
    force: false,
  };

  if (config.migrate === undefined) {
    resolvedConfig.migrate = defaultConfig;
    return;
  }

  if (!isRelativePath(config.migrate.pathToMigrations)) {
    throw new NomicLabsHardhatPluginError(pluginName, "config.migrate.pathToMigrations must be a relative path");
  }

  const { cloneDeep } = require("lodash");
  const customConfig = cloneDeep(config.migrate);

  resolvedConfig.migrate = { ...defaultConfig, ...customConfig };
};

const isRelativePath = (path?: string): boolean => path === undefined || !isAbsolute(path);

import { isAbsolute } from "path";

import { HardhatPluginError } from "hardhat/plugins";
import { ConfigExtender } from "hardhat/types";

import { pluginName } from "./constants";

import { MigrateConfig, MigrateVerifyConfig } from "./types/migrations";

const defaultConfig: MigrateConfig = {
  from: -1,
  to: -1,
  only: -1,
  skip: -1,
  wait: 1,
  verificationDelay: 5000,
  verify: false,
  verifyParallel: 1,
  verifyAttempts: 3,
  pathToMigrations: "./deploy",
  force: false,
  continue: false,
  transactionStatusCheckInterval: 2000,
};

const defaultVerifyConfig: MigrateVerifyConfig = {
  inputFile: undefined,
  parallel: 1,
  attempts: 3,
};

export const migrateConfigExtender: ConfigExtender = (resolvedConfig, config) => {
  resolvedConfig.migrate = mergeConfigs(config.migrate, defaultConfig);
};

export const mergeConfigs = (
  cliArgs: Partial<MigrateConfig> | undefined,
  migrateConfig: MigrateConfig,
): MigrateConfig => {
  const config = cliArgs === undefined ? migrateConfig : { ...migrateConfig, ...definedProps(cliArgs) };

  if (config.wait !== undefined && config.wait < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.wait must be greater than 0");
  }

  if (config.verifyParallel !== undefined && config.verifyParallel < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.verifyParallel must be greater than 0");
  }

  if (config.verifyAttempts !== undefined && config.verifyAttempts < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.verifyAttempts must be greater than 0");
  }

  if (config.pathToMigrations !== undefined && !isRelativePath(config.pathToMigrations)) {
    throw new HardhatPluginError(pluginName, "config.migrate.pathToMigrations must be a relative path");
  }

  if (config.transactionStatusCheckInterval !== undefined && config.transactionStatusCheckInterval < 1000) {
    throw new HardhatPluginError(
      pluginName,
      "config.migrate.transactionStatusCheckInterval must be greater or equal to 1000",
    );
  }

  return config;
};

export const extendVerifyConfigs = (cliArgs: Partial<MigrateVerifyConfig> | undefined): MigrateVerifyConfig => {
  const config = cliArgs === undefined ? defaultVerifyConfig : { ...defaultVerifyConfig, ...definedProps(cliArgs) };

  if (config.parallel !== undefined && config.parallel < 1) {
    throw new HardhatPluginError(pluginName, "parallel must be greater than 0");
  }

  if (config.attempts !== undefined && config.attempts < 1) {
    throw new HardhatPluginError(pluginName, "attempts must be greater than 0");
  }

  return config;
};

const definedProps = (obj: any): any => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const isRelativePath = (path?: string): boolean => path === undefined || !isAbsolute(path);

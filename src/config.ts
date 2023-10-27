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
  verify: false,
  verifyParallel: 1,
  verifyAttempts: 3,
  pathToMigrations: "./deploy",
  force: false,
  continue: false,
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
  config: Partial<MigrateConfig> | undefined,
  defaultConfig: MigrateConfig,
): MigrateConfig => {
  if (config === undefined) {
    return defaultConfig;
  }

  if (config.wait && config.wait < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.wait must be greater than 0");
  }

  if (config.verifyParallel && config.verifyParallel < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.verifyParallel must be greater than 0");
  }

  if (config.verifyAttempts && config.verifyAttempts < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.verifyAttempts must be greater than 0");
  }

  if (config.pathToMigrations && !isRelativePath(config.pathToMigrations)) {
    throw new HardhatPluginError(pluginName, "config.migrate.pathToMigrations must be a relative path");
  }

  return { ...defaultConfig, ...definedProps(config) };
};

export const extendVerifyConfigs = (config: Partial<MigrateVerifyConfig> | undefined): MigrateVerifyConfig => {
  if (config === undefined) {
    return defaultVerifyConfig;
  }

  if (config.parallel && config.parallel < 1) {
    throw new HardhatPluginError(pluginName, "parallel must be greater than 0");
  }

  if (config.attempts && config.attempts < 1) {
    throw new HardhatPluginError(pluginName, "attempts must be greater than 0");
  }

  return { ...defaultVerifyConfig, ...definedProps(config) };
};

const definedProps = (obj: any): any => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const isRelativePath = (path?: string): boolean => path === undefined || !isAbsolute(path);

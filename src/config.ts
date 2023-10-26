import { isAbsolute } from "path";

import { HardhatPluginError } from "hardhat/plugins";
import { ConfigExtender } from "hardhat/types";

import { pluginName } from "./constants";

import { MigrateConfig } from "./types/migrations";

const defaultConfig: MigrateConfig = {
  from: -1,
  to: -1,
  only: -1,
  skip: -1,
  wait: 1,
  verify: false,
  pathToMigrations: "./deploy",
  force: false,
  continue: false,
  verifyParallel: 1,
  verifyAttempts: 3,
};

const defaultVerifyConfig: MigrateConfig["verifyConfig"] = {
  inputFile: ".storage.json",
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

  if ((config as any).parallel) {
    (config.verifyConfig as any) ??= {};
    config.verifyConfig!.parallel ??= (config as any).parallel;
  }

  if ((config as any).attempts) {
    (config.verifyConfig as any) ??= {};
    config.verifyConfig!.attempts ??= (config as any).attempts;
  }

  if (config.wait && config.wait < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.wait must be greater than 0");
  }

  if (config.verifyConfig) {
    if (config.verifyConfig.parallel && config.verifyConfig.parallel < 1) {
      throw new HardhatPluginError(pluginName, "config.migrate.verifyConfig.parallel must be greater than 0");
    }

    if (config.verifyConfig.attempts && config.verifyConfig.attempts < 1) {
      throw new HardhatPluginError(pluginName, "config.migrate.verifyConfig.attempts must be greater than 0");
    }
  }

  if (config.pathToMigrations && !isRelativePath(config.pathToMigrations)) {
    throw new HardhatPluginError(pluginName, "config.migrate.pathToMigrations must be a relative path");
  }

  return { ...defaultConfig, ...definedProps(config) };
};

const definedProps = (obj: Partial<MigrateConfig>): Partial<MigrateConfig> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<MigrateConfig>;

const isRelativePath = (path?: string): boolean => path === undefined || !isAbsolute(path);

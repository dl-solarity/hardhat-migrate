import { isAbsolute } from "path";

import { HardhatPluginError } from "hardhat/plugins";
import { ConfigExtender } from "hardhat/types";

import { pluginName } from "./constants";

import { MigrateConfig, VerifyStrategy } from "./types/migrations";

const defaultConfig: MigrateConfig = {
  from: -1,
  to: -1,
  only: -1,
  skip: -1,
  wait: 1,
  verify: VerifyStrategy.AtTheEnd,
  attempts: 0,
  pathToMigrations: "./deploy",
  skipVerificationErrors: ["already verified"],
  force: false,
  continue: false,
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

  if (config.pathToMigrations && !isRelativePath(config.pathToMigrations)) {
    throw new HardhatPluginError(pluginName, "config.migrate.pathToMigrations must be a relative path");
  }

  return { ...defaultConfig, ...definedProps(config) };
};

const definedProps = (obj: Partial<MigrateConfig>): Partial<MigrateConfig> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<MigrateConfig>;

const isRelativePath = (path?: string): boolean => path === undefined || !isAbsolute(path);

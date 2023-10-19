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
  txConfirmations: 1,
  verifyConfirmations: 0,
  verify: VerifyStrategy.AtTheEnd,
  attempts: 0,
  pathToMigrations: "./deploy",
  skipVerificationErrors: ["already verified"],
  force: false,
  continuePreviousDeployment: false,
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

  if (config.pathToMigrations && !isRelativePath(config.pathToMigrations)) {
    throw new HardhatPluginError(pluginName, "config.migrate.pathToMigrations must be a relative path");
  }

  return { ...defaultConfig, ...definedProps(config) };
};

const definedProps = (obj: Partial<MigrateConfig>): Partial<MigrateConfig> =>
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Object.fromEntries(Object.entries(obj).filter(([k, v]) => v !== undefined)) as Partial<MigrateConfig>;

const isRelativePath = (path?: string): boolean => path === undefined || !isAbsolute(path);

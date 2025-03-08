import { isAbsolute } from "path";

import { HardhatPluginError } from "hardhat/plugins";
import { ConfigExtender } from "hardhat/types";

import { pluginName } from "./constants";

import { DeepPartial, MigrateConfig, MigrateVerifyConfig } from "./types/migrations";

const defaultConfig: MigrateConfig = {
  filter: {
    from: -1,
    to: -1,
    only: -1,
    skip: -1,
  },
  verification: {
    verify: false,
    verificationDelay: 5000,
    verifyParallel: 1,
    verifyAttempts: 3,
  },
  paths: {
    pathToMigrations: "./deploy",
    namespace: "",
  },
  execution: {
    force: false,
    continue: false,
    wait: 1,
    transactionStatusCheckInterval: 2000,
    withoutCLIReporting: false,
  },
  castWallet: {
    enabled: false,
  },
  trezorWallet: {
    enabled: false,
    mnemonicIndex: 0,
  },
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
  externalConfig: DeepPartial<MigrateConfig> | undefined,
  migrateConfig: MigrateConfig,
): MigrateConfig => {
  if (externalConfig) {
    return deepMerge(migrateConfig, externalConfig);
  }

  return migrateConfig;
};

export function convertFlatToNested(flatConfig: any): Partial<MigrateConfig> {
  const result: Partial<MigrateConfig> = {};

  if (flatConfig.from || flatConfig.to || flatConfig.only || flatConfig.skip) {
    result.filter = {} as any;
  }

  if (flatConfig.from) result.filter!.from = flatConfig.from;
  if (flatConfig.to) result.filter!.to = flatConfig.to;
  if (flatConfig.only) result.filter!.only = flatConfig.only;
  if (flatConfig.skip) result.filter!.skip = flatConfig.skip;

  if (flatConfig.verify || flatConfig.verificationDelay || flatConfig.verifyParallel || flatConfig.verifyAttempts) {
    result.verification = {} as any;
  }

  if (flatConfig.verify) result.verification!.verify = flatConfig.verify;
  if (flatConfig.verificationDelay) result.verification!.verificationDelay = flatConfig.verificationDelay;
  if (flatConfig.verifyParallel) result.verification!.verifyParallel = flatConfig.verifyParallel;
  if (flatConfig.verifyAttempts) result.verification!.verifyAttempts = flatConfig.verifyAttempts;

  if (flatConfig.pathToMigrations || flatConfig.namespace) {
    result.paths = {} as any;
  }

  if (flatConfig.pathToMigrations) result.paths!.pathToMigrations = flatConfig.pathToMigrations;
  if (flatConfig.namespace) result.paths!.namespace = flatConfig.namespace;

  if (flatConfig.force || flatConfig.continue || flatConfig.wait || flatConfig.transactionStatusCheckInterval) {
    result.execution = {} as any;
  }

  if (flatConfig.force) result.execution!.force = flatConfig.force;
  if (flatConfig.continue) result.execution!.continue = flatConfig.continue;
  if (flatConfig.wait) result.execution!.wait = flatConfig.wait;
  if (flatConfig.transactionStatusCheckInterval)
    result.execution!.transactionStatusCheckInterval = flatConfig.transactionStatusCheckInterval;

  if (
    flatConfig.castEnabled ||
    flatConfig.passwordFile ||
    flatConfig.keystore ||
    flatConfig.mnemonicIndex ||
    flatConfig.account ||
    flatConfig.interactive
  ) {
    result.castWallet = {} as any;
  }

  if (flatConfig.castEnabled) result.castWallet!.enabled = flatConfig.castEnabled;
  if (flatConfig.passwordFile) result.castWallet!.passwordFile = flatConfig.passwordFile;
  if (flatConfig.keystore) result.castWallet!.keystore = flatConfig.keystore;
  if (flatConfig.mnemonicIndex) result.castWallet!.mnemonicIndex = flatConfig.mnemonicIndex;
  if (flatConfig.account) result.castWallet!.account = flatConfig.account;
  if (flatConfig.interactive) result.castWallet!.interactive = flatConfig.interactive;

  if (flatConfig.trezorEnabled || flatConfig.trezorMnemonicIndex) {
    result.trezorWallet = {} as any;
  }

  if (flatConfig.trezorEnabled) result.trezorWallet!.enabled = flatConfig.trezorEnabled;
  if (flatConfig.trezorMnemonicIndex) result.trezorWallet!.mnemonicIndex = flatConfig.trezorMnemonicIndex;

  return result;
}

// Deep merge utility for nested objects
function deepMerge(target: any, source: any): any {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }

  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === "object" && !Array.isArray(item);
}

export const validateConfig = (config: MigrateConfig): void => {
  if (config.execution.wait !== undefined && config.execution.wait < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.execution.wait must be greater than 0");
  }

  if (config.verification.verifyParallel !== undefined && config.verification.verifyParallel < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.verification.verifyParallel must be greater than 0");
  }

  if (config.verification.verifyAttempts !== undefined && config.verification.verifyAttempts < 1) {
    throw new HardhatPluginError(pluginName, "config.migrate.verification.verifyAttempts must be greater than 0");
  }

  if (config.paths.pathToMigrations !== undefined && !isRelativePath(config.paths.pathToMigrations)) {
    throw new HardhatPluginError(pluginName, "config.migrate.paths.pathToMigrations must be a relative path");
  }

  if (config.trezorWallet.enabled && config.castWallet.enabled) {
    throw new HardhatPluginError(
      pluginName,
      "config.migrate.trezorWallet.enabled and config.migrate.castWallet.enabled cannot be enabled at the same time",
    );
  }

  if (
    config.execution.transactionStatusCheckInterval !== undefined &&
    config.execution.transactionStatusCheckInterval < 1000
  ) {
    throw new HardhatPluginError(
      pluginName,
      "config.migrate.execution.transactionStatusCheckInterval must be greater or equal to 1000",
    );
  }
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

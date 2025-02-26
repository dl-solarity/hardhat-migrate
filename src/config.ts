import { isAbsolute } from "path";

import { HardhatPluginError } from "hardhat/plugins";
import { ConfigExtender } from "hardhat/types";

import { pluginName } from "./constants";

import { MigrateConfig, MigrateVerifyConfig } from "./types/migrations";

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
  externalConfig: Partial<MigrateConfig> | undefined,
  migrateConfig: MigrateConfig,
): MigrateConfig => {
  if (externalConfig) {
    return deepMerge(migrateConfig, externalConfig.filter ? externalConfig : convertFlatToNested(externalConfig));
  }

  return migrateConfig;
};

export function convertFlatToNested(flatConfig: any): Partial<MigrateConfig> {
  const result: Partial<MigrateConfig> = {};

  result.filter = {
    from: flatConfig.from ?? defaultConfig.filter.from,
    to: flatConfig.to ?? defaultConfig.filter.to,
    only: flatConfig.only ?? defaultConfig.filter.only,
    skip: flatConfig.skip ?? defaultConfig.filter.skip,
  };

  result.verification = {
    verify: flatConfig.verify ?? false,
    verificationDelay: flatConfig.verificationDelay ?? defaultConfig.verification.verificationDelay,
    verifyParallel: flatConfig.verifyParallel ?? defaultConfig.verification.verifyParallel,
    verifyAttempts: flatConfig.verifyAttempts ?? defaultConfig.verification.verifyAttempts,
  };

  result.paths = {
    pathToMigrations: flatConfig.pathToMigrations ?? defaultConfig.paths.pathToMigrations,
    namespace: flatConfig.namespace ?? defaultConfig.paths.namespace,
  };

  result.execution = {
    force: flatConfig.force ?? defaultConfig.execution.force,
    continue: flatConfig.continue ?? defaultConfig.execution.continue,
    wait: flatConfig.wait ?? defaultConfig.execution.wait,
    transactionStatusCheckInterval:
      flatConfig.transactionStatusCheckInterval ?? defaultConfig.execution.transactionStatusCheckInterval,
  };

  result.castWallet = {
    enabled: flatConfig.castWalletEnabled ?? defaultConfig.castWallet.enabled,
    passwordFile: flatConfig.passwordFile,
    keystore: flatConfig.keystore,
    mnemonicIndex: flatConfig.mnemonicIndex,
    account: flatConfig.account,
    interactive: flatConfig.interactive,
  };

  result.trezorWallet = {
    enabled: flatConfig.trezorEnabled ?? defaultConfig.trezorWallet.enabled,
    mnemonicIndex: flatConfig.trezorMnemonicIndex ?? defaultConfig.trezorWallet.mnemonicIndex,
  };

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

import { isAbsolute } from "path";

import type { ConfigurationVariableResolver, HardhatConfig, HardhatUserConfig } from "hardhat/types/config";
import type { ConfigHooks, HardhatUserConfigValidationError } from "hardhat/types/hooks";

import { validateUserConfigZodType } from "@nomicfoundation/hardhat-zod-utils";

import { z } from "zod";

import type { MigrateConfig, MigrateConfigArgs, MigrateUserConfig, MigrateVerifyConfig } from "./types/index.js";
import { PLUGIN_ID } from "./constants.js";

export default async (): Promise<Partial<ConfigHooks>> => ({
  validateUserConfig,
  resolveUserConfig,
});

const userConfigType = z.object({
  migrate: z
    .object({
      filter: z
        .object({
          from: z.number().int().optional(),
          to: z.number().int().optional(),
          only: z.number().int().optional(),
          skip: z.number().int().optional(),
        })
        .optional(),
      verification: z
        .object({
          verify: z.boolean().optional(),
          verificationDelay: z.number().int().optional(),
          verifyParallel: z.number().int().optional(),
          verifyAttempts: z.number().int().optional(),
        })
        .optional(),
      paths: z
        .object({
          pathToMigrations: z
            .string()
            .refine((p) => !isAbsolute(p), "Expected a relative path")
            .optional(),
          namespace: z.string().optional(),
          reportPath: z
            .string()
            .refine((p) => !isAbsolute(p), "Expected a relative path")
            .optional(),
          reportFormat: z.enum(["json", "md"]).optional(),
        })
        .optional(),
      execution: z
        .object({
          force: z.boolean().optional(),
          continue: z.boolean().optional(),
          wait: z.number().int().optional(),
          transactionStatusCheckInterval: z.number().int().optional(),
          withoutCLIReporting: z.boolean().optional(),
        })
        .optional(),
      castWallet: z
        .object({
          passwordFile: z.string().optional(),
          keystore: z.string().optional(),
          account: z.string().optional(),
        })
        .optional(),
      trezorWallet: z
        .object({
          enabled: z.boolean().optional(),
          mnemonicIndex: z.number().int().optional(),
        })
        .optional(),
    })
    .optional(),
});

export async function validateUserConfig(userConfig: HardhatUserConfig): Promise<HardhatUserConfigValidationError[]> {
  return validateUserConfigZodType(userConfig, userConfigType);
}

export async function resolveUserConfig(
  userConfig: HardhatUserConfig,
  resolveConfigurationVariable: ConfigurationVariableResolver,
  next: (
    nextUserConfig: HardhatUserConfig,
    nextResolveConfigurationVariable: ConfigurationVariableResolver,
  ) => Promise<HardhatConfig>,
): Promise<HardhatConfig> {
  const resolvedConfig = await next(userConfig, resolveConfigurationVariable);

  const migrate = await resolveMigrateConfig(userConfig.migrate, resolveConfigurationVariable);

  return {
    ...resolvedConfig,
    migrate,
  };
}

async function resolveMigrateConfig(
  externalConfig: MigrateUserConfig | undefined,
  _resolveConfigurationVariable: ConfigurationVariableResolver,
): Promise<MigrateConfig> {
  const defaults: MigrateConfig = {
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
      reportPath: "cache",
      reportFormat: "md",
    },
    execution: {
      force: false,
      continue: false,
      wait: 1,
      transactionStatusCheckInterval: 2000,
      withoutCLIReporting: false,
    },
    castWallet: {},
    trezorWallet: {
      enabled: false,
      mnemonicIndex: 0,
    },
  };

  if (externalConfig === undefined) {
    return defaults;
  }

  const resolved: MigrateConfig = JSON.parse(JSON.stringify(defaults));

  // Filter
  if (externalConfig.filter) {
    if (typeof externalConfig.filter.from === "number") resolved.filter.from = externalConfig.filter.from;
    if (typeof externalConfig.filter.to === "number") resolved.filter.to = externalConfig.filter.to;
    if (typeof externalConfig.filter.only === "number") resolved.filter.only = externalConfig.filter.only;
    if (typeof externalConfig.filter.skip === "number") resolved.filter.skip = externalConfig.filter.skip;
  }

  // Verification
  if (externalConfig.verification) {
    const v = externalConfig.verification;
    if (typeof v.verify === "boolean") resolved.verification.verify = v.verify;
    if (typeof v.verificationDelay === "number") resolved.verification.verificationDelay = v.verificationDelay;
    if (typeof v.verifyParallel === "number") resolved.verification.verifyParallel = v.verifyParallel;
    if (typeof v.verifyAttempts === "number") resolved.verification.verifyAttempts = v.verifyAttempts;
  }

  // Paths
  if (externalConfig.paths) {
    const p = externalConfig.paths;
    if (typeof p.pathToMigrations === "string") resolved.paths.pathToMigrations = p.pathToMigrations;
    if (typeof p.namespace === "string") resolved.paths.namespace = p.namespace;
    if (typeof p.reportPath === "string") resolved.paths.reportPath = p.reportPath;
    resolved.paths.reportFormat = p.reportFormat as "json" | "md";
  }

  // Execution
  if (externalConfig.execution) {
    const e = externalConfig.execution;
    if (typeof e.force === "boolean") resolved.execution.force = e.force;
    if (typeof e.continue === "boolean") resolved.execution.continue = e.continue;
    if (typeof e.wait === "number") resolved.execution.wait = e.wait;
    if (typeof e.transactionStatusCheckInterval === "number")
      resolved.execution.transactionStatusCheckInterval = e.transactionStatusCheckInterval;
    if (typeof e.withoutCLIReporting === "boolean") resolved.execution.withoutCLIReporting = e.withoutCLIReporting;
  }

  // Cast wallet
  if (externalConfig.castWallet) {
    resolved.castWallet.passwordFile = externalConfig.castWallet.passwordFile;
    resolved.castWallet.keystore = externalConfig.castWallet.keystore;
    resolved.castWallet.account = externalConfig.castWallet.account;
  }

  // Trezor wallet
  if (externalConfig.trezorWallet) {
    const t = externalConfig.trezorWallet;
    if (typeof t.enabled === "boolean") resolved.trezorWallet.enabled = t.enabled;
    if (typeof t.mnemonicIndex === "number") resolved.trezorWallet.mnemonicIndex = t.mnemonicIndex;
  }

  return resolved;
}

export const mergeConfigs = (
  externalConfig: Partial<MigrateConfig> | undefined,
  migrateConfig: MigrateConfig,
): MigrateConfig => {
  if (externalConfig) {
    return deepMerge(migrateConfig, externalConfig);
  }
  return migrateConfig;
};

export function convertFlatToNested(flatConfig: MigrateConfigArgs): Partial<MigrateConfig> {
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

  if (flatConfig.pathToMigrations || flatConfig.namespace || flatConfig.reportPath || flatConfig.reportFormat) {
    result.paths = {} as any;
  }

  if (flatConfig.pathToMigrations) result.paths!.pathToMigrations = flatConfig.pathToMigrations;
  if (flatConfig.namespace) result.paths!.namespace = flatConfig.namespace;
  if (flatConfig.reportPath) result.paths!.reportPath = flatConfig.reportPath;
  if (flatConfig.reportFormat) result.paths!.reportFormat = flatConfig.reportFormat;

  if (flatConfig.force || flatConfig.continue || flatConfig.wait || flatConfig.transactionStatusCheckInterval) {
    result.execution = {} as any;
  }

  if (flatConfig.force) result.execution!.force = flatConfig.force;
  if (flatConfig.continue) result.execution!.continue = flatConfig.continue;
  if (flatConfig.wait) result.execution!.wait = flatConfig.wait;
  if (flatConfig.transactionStatusCheckInterval)
    result.execution!.transactionStatusCheckInterval = flatConfig.transactionStatusCheckInterval;

  if (flatConfig.passwordFile || flatConfig.keystore || flatConfig.account) {
    result.castWallet = {} as any;
  }

  if (flatConfig.passwordFile) result.castWallet!.passwordFile = flatConfig.passwordFile;
  if (flatConfig.keystore) result.castWallet!.keystore = flatConfig.keystore;
  if (flatConfig.account) result.castWallet!.account = flatConfig.account;

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
    throw new Error(`[${PLUGIN_ID}] config.migrate.execution.wait must be greater than 0`);
  }

  if (config.verification.verifyParallel !== undefined && config.verification.verifyParallel < 1) {
    throw new Error(`[${PLUGIN_ID}] config.migrate.verification.verifyParallel must be greater than 0`);
  }

  if (config.verification.verifyAttempts !== undefined && config.verification.verifyAttempts < 1) {
    throw new Error(`[${PLUGIN_ID}] config.migrate.verification.verifyAttempts must be greater than 0`);
  }

  if (config.paths.pathToMigrations !== undefined && !isRelativePath(config.paths.pathToMigrations)) {
    throw new Error(`[${PLUGIN_ID}] config.migrate.paths.pathToMigrations must be a relative path`);
  }

  if (config.paths.reportFormat !== undefined && !["json", "md"].includes(config.paths.reportFormat)) {
    throw new Error(`[${PLUGIN_ID}] config.migrate.paths.reportFormat must be either 'json' or 'md'`);
  }

  if (config.trezorWallet.enabled && config.castWallet.account) {
    throw new Error(
      `[${PLUGIN_ID}] config.migrate.trezorWallet.enabled and config.migrate.castWallet.account cannot be enabled at the same time`,
    );
  }

  if (config.castWallet.account && config.castWallet.keystore) {
    throw new Error(
      `[${PLUGIN_ID}] config.migrate.castWallet.account and config.migrate.castWallet.keystore cannot be enabled at the same time`,
    );
  }

  if (
    config.execution.transactionStatusCheckInterval !== undefined &&
    config.execution.transactionStatusCheckInterval < 1000
  ) {
    throw new Error(
      `[${PLUGIN_ID}] config.migrate.execution.transactionStatusCheckInterval must be greater or equal to 1000`,
    );
  }
};

export const extendVerifyConfigs = (cliArgs: Partial<MigrateVerifyConfig> | undefined): MigrateVerifyConfig => {
  const defaultVerifyConfig: MigrateVerifyConfig = {
    inputFile: undefined,
    parallel: 1,
    attempts: 3,
  };

  const config = cliArgs === undefined ? defaultVerifyConfig : { ...defaultVerifyConfig, ...definedProps(cliArgs) };

  if (config.parallel !== undefined && config.parallel < 1) {
    throw new Error(`[${PLUGIN_ID}] parallel must be greater than 0`);
  }

  if (config.attempts !== undefined && config.attempts < 1) {
    throw new Error(`[${PLUGIN_ID}] attempts must be greater than 0`);
  }

  return config;
};

const definedProps = (obj: any): any => Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));

const isRelativePath = (path?: string): boolean => path === undefined || !isAbsolute(path);

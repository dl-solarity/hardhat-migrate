import { ActionType, HardhatRuntimeEnvironment } from "hardhat/types";
import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, task, types } from "hardhat/config";

import "./type-extensions";

import {
  convertFlatToNested,
  extendVerifyConfigs,
  mergeConfigs,
  migrateConfigExtender,
  validateConfig,
} from "./config";
import { TASK_MIGRATE, TASK_MIGRATE_VERIFY } from "./constants";

import { MigrateConfigArgs, MigrateVerifyConfig } from "./types/migrations";

import { DefaultStorage } from "./tools/storage/MigrateStorage";
import { VerificationProcessor } from "./tools/storage/VerificationProcessor";

import { Migrator } from "./migrator/Migrator";
import { Verifier } from "./verifier/Verifier";

export { Deployer } from "./deployer/Deployer";
export { PublicReporter as Reporter } from "./tools/reporters/PublicReporter";
export { UserStorage, TransactionStorage, VerificationStorage, ArtifactStorage } from "./tools/storage/MigrateStorage";

extendConfig(migrateConfigExtender);

const migrate: ActionType<MigrateConfigArgs> = async (taskArgs, env) => {
  env.config.migrate = mergeConfigs(convertFlatToNested(taskArgs), env.config.migrate);
  validateConfig(env.config.migrate);

  await env.run(TASK_COMPILE, {
    quiet: true,
    force: env.config.migrate.execution.force,
  });

  await Migrator.buildMigrateTaskDeps(env);

  await new Migrator(env).migrate();

  if (env.config.migrate.verification.verify) {
    await runMigrateVerify(env, {} as any);
  }
};

const migrateVerify: ActionType<MigrateVerifyConfig> = async (taskArgs, env) => {
  await runMigrateVerify(env, taskArgs, true);
};

async function runMigrateVerify(env: HardhatRuntimeEnvironment, taskArgs: MigrateVerifyConfig, standalone = false) {
  const config = extendVerifyConfigs(taskArgs);

  await Verifier.buildVerifierTaskDeps(env);

  await new Verifier(env, config, standalone).verifyBatch(
    VerificationProcessor.restoreSavedVerificationFunctions(config.inputFile),
  );
}

task(TASK_CLEAN, "Clears the cache and deletes all artifacts").setAction(async (conf, hre, runSuper) => {
  DefaultStorage.deleteStateFile();

  await runSuper();
});

task(TASK_MIGRATE, "Deploy contracts via migration files")
  // Filter params
  .addOptionalParam("from", "The migration number from which the migration will be applied.", undefined, types.int)
  .addOptionalParam("to", "The migration number up to which the migration will be applied.", undefined, types.int)
  .addOptionalParam(
    "only",
    "The number of the migration that will be applied. Overrides from and to parameters.",
    undefined,
    types.int,
  )
  .addOptionalParam("skip", "The number of migration to skip. Overrides only parameter.", undefined, types.int)

  // Execution params
  .addOptionalParam("wait", "The number of blocks to wait for the transaction to be mined.", undefined, types.int)
  .addFlag("force", "The flag indicating whether the compilation is forced.")
  .addFlag("continue", "The flag indicating whether the previous deployment should be continued.")

  // Verification params
  .addOptionalParam(
    "verificationDelay",
    "The time in milliseconds to wait before the verification process starts.",
    undefined,
    types.int,
  )
  .addFlag("verify", "The flag indicating whether the contracts should be verified.")
  .addOptionalParam("verifyParallel", "The size of the batch for verification.", undefined, types.int)
  .addOptionalParam("verifyAttempts", "The number of attempts to verify the contract.", undefined, types.int)

  // Path params
  .addOptionalParam(
    "pathToMigrations",
    "The path to the folder with the specified migrations.",
    undefined,
    types.string,
  )
  .addOptionalParam("namespace", "The path to the folder where the migration should be done.", undefined, types.string)

  // Cast wallet params
  .addOptionalParam("passwordFile", "File path to the keystore password", undefined, types.string)
  .addOptionalParam("keystore", "Use a keystore file or directory", undefined, types.string)
  .addOptionalParam(
    "account",
    "The name of the cast wallet account (when using the default keystore directory)",
    undefined,
    types.string,
  )

  // Trezor wallet params
  .addFlag("trezorEnabled", "Enable Trezor hardware wallet for signing transactions")
  .addOptionalParam("trezorMnemonicIndex", "The mnemonic index for Trezor wallet", undefined, types.int)

  .addOptionalParam(
    "reportPath",
    "The path to directory where the migration report should be saved",
    undefined,
    types.string,
  )
  .addOptionalParam(
    "reportFormat",
    "The format of the migration report (json or md)",
    "md",
    types.string,
  )

  .setAction(migrate);

task(TASK_MIGRATE_VERIFY, "Verify contracts via .storage")
  .addOptionalParam("inputFile", "The path to the .storage file.", undefined, types.inputFile)
  .addOptionalParam("parallel", "The size of the batch for verification.", undefined, types.int)
  .addOptionalParam("attempts", "The number of attempts to verify the contract.", undefined, types.int)
  .setAction(migrateVerify);

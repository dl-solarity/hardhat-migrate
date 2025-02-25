import { ActionType, HardhatRuntimeEnvironment } from "hardhat/types";
import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, task, types } from "hardhat/config";

import "./type-extensions";

import { extendVerifyConfigs, mergeConfigs, migrateConfigExtender } from "./config";
import { TASK_MIGRATE, TASK_MIGRATE_VERIFY } from "./constants";

import { MigrateConfig, MigrateVerifyConfig } from "./types/migrations";

import { DefaultStorage } from "./tools/storage/MigrateStorage";
import { VerificationProcessor } from "./tools/storage/VerificationProcessor";

import { Migrator } from "./migrator/Migrator";
import { Verifier } from "./verifier/Verifier";

export { Deployer } from "./deployer/Deployer";
export { PublicReporter as Reporter } from "./tools/reporters/PublicReporter";
export { UserStorage, TransactionStorage, VerificationStorage, ArtifactStorage } from "./tools/storage/MigrateStorage";

extendConfig(migrateConfigExtender);

const migrate: ActionType<MigrateConfig> = async (taskArgs, env) => {
  env.config.migrate = mergeConfigs(taskArgs, env.config.migrate);

  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
    force: env.config.migrate.force,
  });

  await Migrator.buildMigrateTaskDeps(env);

  await new Migrator(env).migrate();

  if (env.config.migrate.verify) {
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
  .addOptionalParam("from", "The migration number from which the migration will be applied.", undefined, types.int)
  .addOptionalParam("to", "The migration number up to which the migration will be applied.", undefined, types.int)
  .addOptionalParam(
    "only",
    "The number of the migration that will be applied. Overrides from and to parameters.",
    undefined,
    types.int,
  )
  .addOptionalParam("skip", "The number of migration to skip. Overrides only parameter.", undefined, types.int)
  .addOptionalParam("wait", "The number of blocks to wait for the transaction to be mined.", undefined, types.int)
  .addOptionalParam(
    "verificationDelay",
    "The time in milliseconds to wait before the verification process starts.",
    undefined,
    types.int,
  )
  .addFlag("verify", "The flag indicating whether the contracts should be verified.")
  .addOptionalParam("verifyParallel", "The size of the batch for verification.", undefined, types.int)
  .addOptionalParam("verifyAttempts", "The number of attempts to verify the contract.", undefined, types.int)
  .addOptionalParam(
    "pathToMigrations",
    "The path to the folder with the specified migrations.",
    undefined,
    types.string,
  )
  .addOptionalParam("namespace", "The path to the folder where the migration should be done.", undefined, types.string)
  .addFlag("force", "The flag indicating whether the compilation is forced.")
  .addFlag("continue", "The flag indicating whether the previous deployment should be continued.")
  .setAction(migrate);

task(TASK_MIGRATE_VERIFY, "Verify contracts via .storage")
  .addOptionalParam("inputFile", "The path to the .storage file.", undefined, types.inputFile)
  .addOptionalParam("parallel", "The size of the batch for verification.", undefined, types.int)
  .addOptionalParam("attempts", "The number of attempts to verify the contract.", undefined, types.int)
  .setAction(migrateVerify);

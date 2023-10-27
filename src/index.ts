import "@nomicfoundation/hardhat-verify";

import { ActionType } from "hardhat/types";
import { lazyObject } from "hardhat/plugins";
import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, extendEnvironment, task, types } from "hardhat/config";

import "./type-extensions";

import { extendVerifyConfigs, mergeConfigs, migrateConfigExtender } from "./config";
import { TASK_MIGRATE, TASK_MIGRATE_VERIFY } from "./constants";

import { MigrateConfig, MigrateVerifyConfig } from "./types/migrations";

import { Reporter } from "./tools/reporters/Reporter";
import { ArtifactProcessor } from "./tools/storage/ArtifactProcessor";
import { DefaultStorage, MigrateStorage } from "./tools/storage/MigrateStorage";
import { VerificationProcessor } from "./tools/storage/VerificationProcessor";

import { Linker } from "./deployer/Linker";
import { Migrator } from "./migrator/Migrator";
import { Provider } from "./tools/Provider";
import { Verifier } from "./verifier/Verifier";

export { Deployer } from "./deployer/Deployer";
export { DefaultStorage } from "./tools/storage/MigrateStorage";

extendConfig(migrateConfigExtender);

const migrate: ActionType<MigrateConfig> = async (taskArgs, env) => {
  await Provider.init(env);

  env.config.migrate = mergeConfigs(taskArgs, env.config.migrate);

  Linker.setConfig(env.config.migrate);
  Reporter.init(env.config.migrate);

  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
    force: env.config.migrate.force,
  });

  if (!env.config.migrate.continue) {
    MigrateStorage.clearAll();
  }

  await ArtifactProcessor.parseArtifacts(env);

  await new Migrator(env).migrate();

  if (env.config.migrate.verify) {
    await env.run(TASK_MIGRATE_VERIFY);
  }
};

const migrateVerify: ActionType<MigrateVerifyConfig> = async (taskArgs, env) => {
  const config = extendVerifyConfigs(taskArgs);

  Reporter.init(env.config.migrate);

  await new Verifier(env, config).verifyBatch(
    VerificationProcessor.restoreSavedVerificationFunctions(config.inputFile),
  );
};

extendEnvironment((hre) => {
  hre.migrator = lazyObject(() => {
    return new Migrator(hre);
  });

  hre.storage = lazyObject(() => DefaultStorage);
});

// TODO: override the `clean` task
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
  .addFlag("verify", "The flag indicating whether the contracts should be verified.")
  .addOptionalParam("verifyParallel", "The size of the batch for verification.", undefined, types.int)
  .addOptionalParam("verifyAttempts", "The number of attempts to verify the contract.", undefined, types.int)
  .addOptionalParam(
    "pathToMigrations",
    "The path to the folder with the specified migrations.",
    undefined,
    types.string,
  )
  .addFlag("force", "The flag indicating whether the compilation is forced.")
  .addFlag("continue", "The flag indicating whether the previous deployment should be continued.")
  .setAction(migrate);

task(TASK_MIGRATE_VERIFY, "Verify contracts via .storage")
  .addOptionalParam("inputFile", "The path to the .storage file.", undefined, types.inputFile)
  .addOptionalParam("parallel", "The size of the batch for verification.", undefined, types.int)
  .addOptionalParam("attempts", "The number of attempts to verify the contract.", undefined, types.int)
  .setAction(migrateVerify);

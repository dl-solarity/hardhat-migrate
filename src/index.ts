import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";

import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, extendEnvironment, task, types } from "hardhat/config";
import { lazyObject } from "hardhat/plugins";
import { ActionType } from "hardhat/types";

import { mergeConfigs, migrateConfigExtender } from "./config";
import { TASK_MIGRATE } from "./constants";

import { Migrator } from "./migrator/migrator";
import { Reporter } from "./tools/reporter/Reporter";

import { ArtifactProcessor } from "./tools/storage/ArtifactProcessor";
import { DefaultStorage } from "./tools/storage/Storage";

import { MigrateConfig } from "./types/migrations";
import { Verifier } from "./verifier/Verifier";

export { Deployer } from "./deployer/Deployer";
export { Verifier } from "./verifier/Verifier";

extendConfig(migrateConfigExtender);

const migrate: ActionType<MigrateConfig> = async (taskArgs, env) => {
  env.config.migrate = mergeConfigs(taskArgs, env.config.migrate);

  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
    force: env.config.migrate.force,
  });

  await ArtifactProcessor.parseArtifacts(env);

  Reporter.init(env);
  Verifier.init(env);

  await new Migrator(env).migrate();
};

extendEnvironment((hre) => {
  hre.migrator = lazyObject(() => {
    return new Migrator(hre);
  });

  hre.storage = lazyObject(() => {
    return DefaultStorage;
  });
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
  .addFlag("verify", "The flag indicating whether the verification of the contract is needed.")
  .addFlag("force", "The flag indicating whether the compilation is forced.")
  .addOptionalParam(
    "confirmations",
    "The number defining after how many blocks the verification should start.",
    undefined,
    types.int,
  )
  .addOptionalParam("attempts", "The number of attempts to verify the contract.", undefined, types.int)
  .addOptionalParam(
    "pathToMigrations",
    "The path to the folder with the specified migrations.",
    undefined,
    types.string,
  )
  .setAction(migrate);

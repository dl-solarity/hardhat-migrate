import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, task, types } from "hardhat/config";
import { ActionType } from "hardhat/types";
import { mergeConfigs, migrateConfigExtender } from "./config";

import { TASK_MIGRATE } from "./constants";
import { Deployer } from "./deployer/Deployer";
import { Migrator } from "./migrator/migrator";
import { MigrateConfig } from "./types/migrations";

extendConfig(migrateConfigExtender);

const migrate: ActionType<MigrateConfig> = async (taskArgs, env) => {
  mergeConfigs(taskArgs, env.config.migrate);

  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
    force: env.config.migrate.force,
  });

  await new Migrator(env).migrate();
};

task(TASK_MIGRATE, "Deploy contracts via migration files")
  .addOptionalParam("from", "The migration number from which the migration will be applied.", undefined, types.int)
  .addOptionalParam("to", "The migration number up to which the migration will be applied.", undefined, types.int)
  .addOptionalParam(
    "only",
    "The number of the migration that will be applied. Overrides from and to parameters.",
    undefined,
    types.int
  )
  .addOptionalParam("skip", "The number of migration to skip. Overrides only parameter.", undefined, types.int)
  .addFlag("verify", "The flag indicating whether the verification of the contract is needed.")
  .addFlag("force", "The flag indicating whether the compilation is forced.")
  .addOptionalParam(
    "confirmations",
    "The number defining after how many blocks the verification should start.",
    undefined,
    types.int
  )
  .addOptionalParam("attempts", "The number of attempts to verify the contract.", undefined, types.int)
  .addOptionalParam(
    "pathToMigrations",
    "The path to the folder with the specified migrations.",
    undefined,
    types.string
  )
  .setAction(migrate);

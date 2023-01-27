import "@nomiclabs/hardhat-etherscan";

import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

import "./type-extensions";

import { extendConfig, task, types } from "hardhat/config";
import { ActionType } from "hardhat/types";

import { migrateConfigExtender } from "./config";
import { TASK_MIGRATE, TASK_MIGRATE_VERIFY } from "./constants";
import { Migrations } from "./deployer/migrations";

export { Deployer } from "./deployer/deployer";
export { Verifier } from "./verifier/verifier";
export { Logger } from "./logger/logger";

interface MigrationArgs {
  // The migration number from which the migration will be applied.
  from?: number;
  // The migration number up to which the migration will be applied.
  to?: number;
  // The number of the migration that will be applied. Overrides from and to parameters.
  only?: number;
  // The number of migration to skip. Overrides only parameter.
  skip?: number;
  // The number defining after how many blocks the verification should start.
  confirmations?: number;
  // The number of attempts to verify the contract.
  attempts?: number;
  // The path to the folder with the specified migrations.
  pathToMigrations?: string;
  // The flag indicating whether the verification of the contract is needed.
  verify: boolean;
  // The flag indicating whether the compilation is forced.
  force: boolean;
}

extendConfig(migrateConfigExtender);

const getMigrationConfig: ActionType<MigrationArgs> = async (
  { from, to, only, skip, confirmations, attempts, pathToMigrations, verify, force },
  env
) => {
  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
    force: force,
  });

  return new Migrations(
    env,
    from === undefined ? env.config.migrate.from : from,
    to === undefined ? env.config.migrate.to : to,
    only === undefined ? env.config.migrate.only : only,
    skip === undefined ? env.config.migrate.skip : skip,
    !verify ? env.config.migrate.verify : verify,
    confirmations === undefined ? env.config.migrate.confirmations : confirmations,
    env.config.migrate.skipVerificationErrors === undefined ? [] : env.config.migrate.skipVerificationErrors,
    attempts === undefined ? env.config.migrate.attempts : attempts,
    pathToMigrations === undefined ? env.config.migrate.pathToMigrations : pathToMigrations
  );
};

const migrate: ActionType<MigrationArgs> = async (taskArgs, env, runSuper) => {
  const migrations = await getMigrationConfig(taskArgs, env, runSuper);

  await migrations.migrate();
};

const migrateVerify: ActionType<MigrationArgs> = async (taskArgs, env, runSuper) => {
  const migrations = await getMigrationConfig(taskArgs, env, runSuper);

  await migrations.migrateVerify();
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

task(TASK_MIGRATE_VERIFY, "Verify contracts via migration files")
  .addOptionalParam("from", "The migration number from which the migration will be applied.", undefined, types.int)
  .addOptionalParam("to", "The migration number up to which the migration will be applied.", undefined, types.int)
  .addOptionalParam(
    "only",
    "The number of the migration that will be applied. Overrides from and to parameters.",
    undefined,
    types.int
  )
  .addOptionalParam("skip", "The number of migration to skip. Overrides only parameter.", undefined, types.int)
  .addFlag("force", "The flag indicating whether the compilation is forced.")
  .addOptionalParam("attempts", "The number of attempts to verify the contract.", undefined, types.int)
  .addOptionalParam(
    "pathToMigrations",
    "The path to the folder with the specified migrations.",
    undefined,
    types.string
  )
  .setAction(migrateVerify);

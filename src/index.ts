require("@nomiclabs/hardhat-etherscan");

import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

import { extendConfig, task, types } from "hardhat/config";
import { ActionType } from "hardhat/types";

import { deployConfigExtender } from "./config";
import { TASK_DEPLOY } from "./constants";
import { Migrations } from "./deployer/migrations";

export { logTransaction, logContracts } from "./logger/logger";

interface DeploymentArgs {
  // Number of the migration from which the migration will be applied.
  from?: number;
  // Number of the migration up to which the migration will be applied.
  to?: number;
  // The number of the migration that will be applied. Overrides from and to parameters.
  only?: number;
  // A number that determines after how many blocks the verification should start.
  confirmations?: number;
  // File path to a folder with specified migrations.
  pathToMigrations?: string;

  // A flag indicating whether the verification of the contract is needed.
  verify: boolean;
}

extendConfig(deployConfigExtender);

const deploy: ActionType<DeploymentArgs> = async ({ from, to, only, confirmations, pathToMigrations, verify }, env) => {
  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
  });

  const migrations = new Migrations(
    env,
    !verify ? env.config.migrate.verify : verify,
    confirmations === undefined ? env.config.migrate.confirmations : confirmations,
    pathToMigrations === undefined ? env.config.migrate.pathToMigrations : pathToMigrations,
    from === undefined ? env.config.migrate.from : from,
    to === undefined ? env.config.migrate.to : to,
    only === undefined ? env.config.migrate.only : only,
    env.config.migrate.excludedErrors
  );
  await migrations.migrate();
};

task(TASK_DEPLOY, "Deploy contracts")
  .addOptionalParam("from", "Name of the file from which the migration will be applied.", undefined, types.int)
  .addOptionalParam("to", "Name of the file up to which the migration will be applied.", undefined, types.int)
  .addOptionalParam(
    "only",
    "The number of the migration that will be applied. Overrides from and to parameters.",
    undefined,
    types.int
  )
  .addFlag("verify", "A flag indicating whether the verification of the contract is needed.")
  .addOptionalParam(
    "confirmations",
    "A number that determines after how many blocks the verification should start.",
    undefined,
    types.int
  )
  .addOptionalParam("pathToMigrations", "File path to a folder with specified migrations.", undefined, types.string)
  .setAction(deploy);

require("@nomiclabs/hardhat-etherscan");

import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";

import { extendConfig, task, types } from "hardhat/config";
import { ActionType } from "hardhat/types";

import { deployConfigExtender } from "./config";
import { TASK_DEPLOY } from "./constants";
import { Migrations } from "./deployer/migrations";

export { logTransaction, logContracts } from "./logger/logger";

interface DeploymentArgs {
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
  verificationAttempts?: number;
  // The path to the folder with the specified migrations.
  pathToMigrations?: string;
  // The flag indicating whether the verification of the contract is needed.
  verify: boolean;
}

extendConfig(deployConfigExtender);

const deploy: ActionType<DeploymentArgs> = async (
  { from, to, only, skip, confirmations, verificationAttempts, pathToMigrations, verify },
  env
) => {
  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
    quiet: true,
    force: true,
  });

  const migrations = new Migrations(
    env,
    !verify ? env.config.migrate.verify : verify,
    confirmations === undefined ? env.config.migrate.confirmations : confirmations,
    pathToMigrations === undefined ? env.config.migrate.pathToMigrations : pathToMigrations,
    from === undefined ? env.config.migrate.from : from,
    to === undefined ? env.config.migrate.to : to,
    only === undefined ? env.config.migrate.only : only,
    skip === undefined ? env.config.migrate.skip : skip,
    env.config.migrate.skipVerificationErrors === undefined ? [] : env.config.migrate.skipVerificationErrors,
    verificationAttempts === undefined ? env.config.migrate.verificationAttempts : verificationAttempts
  );
  await migrations.migrate();
};

task(TASK_DEPLOY, "Deploy contracts")
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
  .addOptionalParam(
    "confirmations",
    "The number defining after how many blocks the verification should start.",
    undefined,
    types.int
  )
  .addOptionalParam("verificationAttempts", "The number of attempts to verify the contract.", undefined, types.int)
  .addOptionalParam(
    "pathToMigrations",
    "The path to the folder with the specified migrations.",
    undefined,
    types.string
  )
  .setAction(deploy);

require("@nomiclabs/hardhat-etherscan");

import {
  TASK_COMPILE,
} from "hardhat/builtin-tasks/task-names";

import { extendConfig, task, types } from "hardhat/config";
import { ActionType } from "hardhat/types";

import { deployConfigExtender } from "./config";
import { TASK_DEPLOY } from "./constants";
import { Migrations } from "./deployer/migrations";

interface DeploymentArgs {
  // A number that determines after how many blocks the verification should start.
  confirmations?: number;
  // File path to a folder with specified migrations.
  pathToMigrations?: string;
  // A flag indicating whether a check is needed.
  verify?: boolean;
}

extendConfig(deployConfigExtender);

const deploy: ActionType<DeploymentArgs> = async (
  { confirmations, pathToMigrations, verify },
  env
) => {
  // Make sure that contract artifacts are up-to-date.
  await env.run(TASK_COMPILE, {
      quiet: true,
    }
  );

  const migrations = new Migrations(
    env,
    verify === undefined ? env.config.migrate.verify : verify,
    confirmations === undefined ? env.config.migrate.confirmations : confirmations,
    pathToMigrations === undefined ? env.config.migrate.pathToMigrations : pathToMigrations
  );
  await migrations.migrate();
};

task(TASK_DEPLOY, "Deploy contract on Etherscan")
  .addOptionalParam(
    "verify",
    "A flag indicating whether a check is needed.",
    undefined,
    types.boolean)
  .addOptionalParam(
    "confirmations",
    "A number that determines after how many blocks the verification should start.",
    undefined,
    types.int
  )
  .addOptionalParam(
    "pathToMigrations",
    "File path to a folder with specified migrations",
    undefined,
    types.string)
  .setAction(deploy);

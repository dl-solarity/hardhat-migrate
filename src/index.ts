require("@nomiclabs/hardhat-etherscan");

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
  const migrations = new Migrations(
    env,
    env.config.hardhat_migrate.verify,
    env.config.hardhat_migrate.confirmations,
    env.config.hardhat_migrate.pathToMigrations
  );
  await migrations.migrate().then();
};

task(TASK_DEPLOY, "Deploy contract on Etherscan")
  .addOptionalParam(
    "verify",
    "A flag indicating whether a check is needed.",
    false,
    types.boolean)
  .addOptionalParam(
    "confirmations",
    "A number that determines after how many blocks the verification should start.",
    0,
    types.int
  )
  .addOptionalParam(
    "pathToMigrations",
    "File path to a folder with specified migrations",
    "",
    types.string)
  .setAction(deploy);

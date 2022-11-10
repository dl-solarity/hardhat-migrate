import { extendConfig, task } from "hardhat/config";
import { ActionType } from "hardhat/types";

import { deployConfigExtender } from "./config";
import { TASK_DEPLOY } from "./constants";
import { Migrations } from "./deployer/migrations";
import env from "hardhat";

// TODO : write documentation
interface DeploymentArgs {
  confirmations?: number;

  pathToMigrations?: string;

  verify?: boolean;
}

extendConfig(deployConfigExtender);

const deploy: ActionType<DeploymentArgs> = async ({
  confirmations,
  pathToMigrations,
  verify,
}) => {
  const migrations = new Migrations(
    env,
    verify,
    confirmations,
    pathToMigrations
  );
  await migrations.migrate().then();
};

task(TASK_DEPLOY, "Deploy contract on Etherscan")
  .addOptionalParam("verify", "Flag that enables verification", false)
  .addOptionalParam(
    "confirmations",
    "A number that determines after how many blocks the verification should start.",
    1
  )
  .addOptionalParam(
    "pathToMigrations",
    "File path to a folder with specified migrations",
    "./deploy/migrations/"
  )
  .setAction(deploy);

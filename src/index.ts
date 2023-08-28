import { TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, task, types } from "hardhat/config";
import { ActionType } from "hardhat/types";
import { migrateConfigExtender } from "./config";

import { TASK_MIGRATE } from "./constants";
import { Deployer } from "./deployer/Deployer";
import { MigrateConfig } from "./types/migrations";

extendConfig(migrateConfigExtender);

const migrate: ActionType<MigrateConfig> = async (taskArgs, env, runSuper) => {
  // await new Deployer(env).deploy();
};

task(TASK_MIGRATE, "Deploy contracts via migration files").setAction(migrate);

import { ArgumentType } from "hardhat/types/arguments";
import type { NewTaskDefinition } from "hardhat/types/tasks";

import { task } from "hardhat/config";

import { TASK_MIGRATE_VERIFY } from "../../../constants.js";

const migrateVerifyTask: NewTaskDefinition = task([TASK_MIGRATE_VERIFY], "Verify contracts via .storage")
  .addOption({
    name: "inputFile",
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    description: "The path to the .storage file.",
    defaultValue: undefined,
  })
  .addOption({
    name: "parallel",
    type: ArgumentType.INT,
    description: "The size of the batch for verification.",
    defaultValue: 1,
  })
  .addOption({
    name: "attempts",
    type: ArgumentType.INT,
    description: "The number of attempts to verify the contract.",
    defaultValue: 3,
  })
  .setAction(() => import("./task-action.js"))
  .build();

export default migrateVerifyTask;

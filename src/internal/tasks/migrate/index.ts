import { ArgumentType } from "hardhat/types/arguments";
import type { NewTaskDefinition } from "hardhat/types/tasks";

import { task } from "hardhat/config";

import { TASK_MIGRATE } from "../../../constants.js";

const migrateTask: NewTaskDefinition = task([TASK_MIGRATE], "Deploy contracts via migration files")
  // Filter params
  .addOption({
    name: "from",
    type: ArgumentType.INT,
    description: "The migration number from which the migration will be applied.",
    defaultValue: -1,
  })
  .addOption({
    name: "to",
    type: ArgumentType.INT,
    description: "The migration number up to which the migration will be applied.",
    defaultValue: -1,
  })
  .addOption({
    name: "only",
    type: ArgumentType.INT,
    description: "The number of the migration that will be applied. Overrides from and to parameters.",
    defaultValue: -1,
  })
  .addOption({
    name: "skip",
    type: ArgumentType.INT,
    description: "The number of migration to skip. Overrides only parameter.",
    defaultValue: -1,
  })

  // Execution params
  .addOption({
    name: "wait",
    type: ArgumentType.INT,
    description: "The number of blocks to wait for the transaction to be mined.",
    defaultValue: 1,
  })
  .addFlag({
    name: "force",
    description: "The flag indicating whether the compilation is forced.",
  })
  .addFlag({
    name: "continue",
    description: "The flag indicating whether the previous deployment should be continued.",
  })

  // Verification params
  .addOption({
    name: "verificationDelay",
    type: ArgumentType.INT,
    description: "The time in milliseconds to wait before the verification process starts.",
    defaultValue: 5000,
  })
  .addFlag({
    name: "verify",
    description: "The flag indicating whether the contracts should be verified.",
  })
  .addOption({
    name: "verifyParallel",
    type: ArgumentType.INT,
    description: "The size of the batch for verification.",
    defaultValue: 1,
  })
  .addOption({
    name: "verifyAttempts",
    type: ArgumentType.INT,
    description: "The number of attempts to verify the contract.",
    defaultValue: 3,
  })

  // Path params
  .addOption({
    name: "pathToMigrations",
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    description: "The path to the folder with the specified migrations.",
    defaultValue: undefined,
  })
  .addOption({
    name: "namespace",
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    description: "The path to the folder where the migration should be done.",
    defaultValue: undefined,
  })

  // Cast wallet params
  .addOption({
    name: "passwordFile",
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    description: "File path to the keystore password",
    defaultValue: undefined,
  })
  .addOption({
    name: "keystore",
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    description: "Use a keystore file or directory",
    defaultValue: undefined,
  })
  .addOption({
    name: "account",
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    description: "The name of the cast wallet account (when using the default keystore directory)",
    defaultValue: undefined,
  })

  // Trezor wallet params
  .addFlag({
    name: "trezorEnabled",
    description: "Enable Trezor hardware wallet for signing transactions",
  })
  .addOption({
    name: "trezorMnemonicIndex",
    type: ArgumentType.INT,
    description: "The mnemonic index for Trezor wallet",
    defaultValue: 0,
  })

  // Report params
  .addOption({
    name: "reportPath",
    type: ArgumentType.STRING_WITHOUT_DEFAULT,
    description: "The path to directory where the migration report should be saved",
    defaultValue: undefined,
  })
  .addOption({
    name: "reportFormat",
    type: ArgumentType.STRING,
    description: "The format of the migration report (json or md)",
    defaultValue: "md",
  })

  .setAction(() => import("./task-action.js"))
  .build();

export default migrateTask;

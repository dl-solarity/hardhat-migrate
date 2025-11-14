import type { NewTaskActionFunction } from "hardhat/types/tasks";

import { convertFlatToNested, extendVerifyConfigs, mergeConfigs, validateConfig } from "../../../config.js";

import { Migrator } from "../../migrator/Migrator.js";
import { Verifier } from "../../verifier/Verifier.js";
import { VerificationProcessor } from "../../tools/storage/VerificationProcessor.js";

import type { MigrateConfigArgs } from "../../../types/index.js";

const migrateAction: NewTaskActionFunction<MigrateConfigArgs> = async (taskArgs, hre) => {
  hre.config.migrate = mergeConfigs(convertFlatToNested(taskArgs), hre.config.migrate);
  validateConfig(hre.config.migrate);

  await hre.tasks.getTask("compile").run({
    quiet: true,
    force: hre.config.migrate.execution.force,
  });

  await Migrator.buildMigrateTaskDeps(hre);

  await new Migrator(hre).migrate();

  if (hre.config.migrate.verification.verify) {
    const verifyConfig = extendVerifyConfigs({} as any);

    await Verifier.buildVerifierTaskDeps(hre);

    await new Verifier(hre, verifyConfig, false).verifyBatch(
      VerificationProcessor.restoreSavedVerificationFunctions(verifyConfig.inputFile),
    );
  }
};

export default migrateAction;

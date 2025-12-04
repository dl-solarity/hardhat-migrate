import type { NewTaskActionFunction } from "hardhat/types/tasks";

import { extendVerifyConfigs } from "../../../config.js";

import { Verifier } from "../../verifier/Verifier.js";
import { VerificationProcessor } from "../../tools/storage/VerificationProcessor.js";

import type { MigrateVerifyConfig } from "../../../types/index.js";

const migrateVerifyAction: NewTaskActionFunction<MigrateVerifyConfig> = async (taskArgs, hre) => {
  const config = extendVerifyConfigs(taskArgs);

  await Verifier.buildVerifierTaskDeps(hre);

  await new Verifier(hre, config, true).verifyBatch(
    VerificationProcessor.restoreSavedVerificationFunctions(config.inputFile),
  );
};

export default migrateVerifyAction;

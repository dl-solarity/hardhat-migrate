import { readFileSync } from "fs";

import { VerificationStorage } from "./MigrateStorage.js";

import { CatchClassError } from "../../utils/index.js";

import { VerifierArgs } from "../../../types/verifier.js";

@CatchClassError
class BaseVerificationProcessor {
  public saveVerificationFunction(verifierArgs: VerifierArgs) {
    const key = verifierArgs.contractAddress;

    VerificationStorage.set(key, verifierArgs, true);
  }

  public restoreSavedVerificationFunctions(filePath?: string): VerifierArgs[] {
    if (filePath) {
      const fileContent = readFileSync(filePath, {
        encoding: "utf8",
      });

      return JSON.parse(fileContent);
    }

    const data = VerificationStorage.getAll() as Record<string, VerifierArgs>;

    return Object.values(data);
  }

  public isVerificationDataSaved(contractAddress: string): boolean {
    return VerificationStorage.has(contractAddress);
  }
}

export const VerificationProcessor = new BaseVerificationProcessor();

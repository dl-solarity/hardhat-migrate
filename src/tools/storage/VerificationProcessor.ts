import { readFileSync } from "fs";

import { VerificationStorage } from "./MigrateStorage";

import { catchError } from "../../utils";

import { VerifierArgs } from "../../types/verifier";

@catchError
export class VerificationProcessor {
  public static saveVerificationFunction(verifierArgs: VerifierArgs) {
    const key = verifierArgs.contractAddress;

    VerificationStorage.set(key, verifierArgs, true);
  }

  public static restoreSavedVerificationFunctions(filePath?: string): VerifierArgs[] {
    if (filePath) {
      const fileContent = readFileSync(filePath, {
        encoding: "utf8",
      });

      return JSON.parse(fileContent);
    }

    const data = VerificationStorage.getAll() as Record<string, VerifierArgs>;

    return Object.values(data);
  }
}

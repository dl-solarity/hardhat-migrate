import { writeFileSync } from "fs";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MigrateError } from "../../errors";
import { resolvePathToFile } from "../../utils";

export class FileHistory {
  private fileName = ".file_storage.json";

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _path: string,
  ) {}

  private _saveFile(fileName: string, fileContent: string) {
    const pathToSave = resolvePathToFile(this._path, fileName);

    try {
      writeFileSync(pathToSave, fileContent, {
        flag: "w",
        encoding: "utf8",
      });
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new MigrateError(`Error writing storage file: ${e.message}`);
      }

      throw e;
    }
  }
}

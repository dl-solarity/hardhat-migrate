import { readFileSync, statSync, writeFileSync } from "fs";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ManualStorage } from "./ManualStorage";

import { MigrateError } from "../../errors";
import { FileMetadata } from "../../types/file-history";
import { resolvePathToFile } from "../../utils";

export class FileHistory {
  private fileName = ".file_storage.json";

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _path: string,
  ) {}

  public async createArtifactsStamps() {
    const artifactNames = await this._hre.artifacts.getAllFullyQualifiedNames();

    const artifactsStamps: Map<string, FileMetadata> = new Map();

    for (const element of artifactNames) {
      const stats = statSync(element);
      artifactsStamps.set(element, {
        lastModified: stats.mtimeMs,
      });
    }

    ManualStorage.getInstance().set("artifactsStamps", artifactsStamps);

    return artifactsStamps;
  }

  public async getArtifactsDifferent(): Promise<string[]> {
    const previousArtifactsStamps = ManualStorage.getInstance().get("artifactsStamps") as Map<string, FileMetadata>;
    if (!previousArtifactsStamps) {
      return [];
    }

    const currentArtifactsStamps = await this.createArtifactsStamps();

    const artifactsDifferent: string[] = [];

    for (const [key, value] of currentArtifactsStamps) {
      if (previousArtifactsStamps.has(key)) {
        if (previousArtifactsStamps.get(key)?.lastModified !== value.lastModified) {
          artifactsDifferent.push(key);
        }
      } else {
        artifactsDifferent.push(key);
      }
    }

    return artifactsDifferent;
  }

  public getMigrationFilesDifferent(_migrationFilesPath: string): string[] {
    const lastMIgrationStartTime: number = ManualStorage.getInstance().get("lastMIgrationStartTime") as number;

    const migrationFilesChanged: string[] = [];

    for (const element of _migrationFilesPath) {
      if (this._fileLastModifiedTime(element) > lastMIgrationStartTime) {
        migrationFilesChanged.push(element);
      }
    }

    // Changed migration files due to artifacts changes
    // TODO: get changed files via SmartCompare??
    const artifactsChanged: string[] = [];

    for (const element of _migrationFilesPath) {
      if (this._migrationContainsArtifact(element, artifactsChanged)) {
        migrationFilesChanged.push(element);
      }
    }

    return migrationFilesChanged;
  }

  private _migrationContainsArtifact(migrationFile: string, artifactsChanged: string[]) {
    const fileContent = readFileSync(migrationFile, { encoding: "utf8", flag: "r" });

    for (const element of artifactsChanged) {
      if (fileContent.includes(element)) {
        return true;
      }
    }

    return false;
  }

  private _saveFile(fileName: string, fileContent: string) {
    const pathToSave = resolvePathToFile(this._path, fileName);

    try {
      writeFileSync(pathToSave, fileContent, {
        flag: "w",
        encoding: "utf8",
      });
    } catch (e: any) {
      throw new MigrateError(`Error writing storage file: ${e.message}`);
    }
  }

  private _fileLastModifiedTime(fileName: string) {
    return statSync(fileName).mtimeMs;
  }
}

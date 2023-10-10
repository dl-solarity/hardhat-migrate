import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

import { bytecodeHash, catchError } from "../utils";

import { ArtifactExtended, NeededLibrary } from "../types/artifacts-parser";

import { TemporaryStorage } from "../tools/storage/TemporaryStorage";

@catchError
export class ArtifactsParser {
  public static async parseArtifacts(_hre: HardhatRuntimeEnvironment): Promise<void> {
    const names = await _hre.artifacts.getAllFullyQualifiedNames();

    const storage = TemporaryStorage.getInstance();

    for (const name of names) {
      const artifact = await _hre.artifacts.readArtifact(name);

      const contract: ArtifactExtended = { ...artifact, neededLibraries: this._parseLibrariesOfArtifact(artifact) };

      storage.save(name, contract);
      storage.save(bytecodeHash(artifact.bytecode), contract);
    }
  }

  private static _parseLibrariesOfArtifact(artifact: Artifact): NeededLibrary[] {
    const libraries = artifact.linkReferences;

    const neededLibraries = [];

    for (const libraryFileName of Object.keys(libraries)) {
      const library = libraries[libraryFileName];

      for (const libraryName of Object.keys(library)) {
        neededLibraries.push({
          sourceName: libraryFileName,
          libName: libraryName,
        });
      }
    }

    return neededLibraries;
  }
}
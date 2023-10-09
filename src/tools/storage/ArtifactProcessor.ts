import { ArtifactStorage } from "./Storage";

import { MigrateError } from "../../errors";

import { bytecodeHash, bytecodeToString } from "../../utils";

import { ArtifactExtended, NeededLibrary , Bytecode } from "../../types/deployer";
import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

// TODO: add reseters for storage (reset on each build (i.e., compile))
export class ArtifactProcessor {
  // TODO: Merge Artifact parser into Artifact storage. (finish it)

  public static async parseArtifacts(_hre: HardhatRuntimeEnvironment): Promise<void> {
    const names = await _hre.artifacts.getAllFullyQualifiedNames();

    for (const name of names) {
      const artifact = await _hre.artifacts.readArtifact(name);

      const contract: ArtifactExtended = { ...artifact, neededLibraries: this._parseLibrariesOfArtifact(artifact) };

      ArtifactStorage.set(name, contract);
      ArtifactStorage.set(bytecodeHash(artifact.bytecode), contract);
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

  public static getExtendedArtifact(bytecode: string): ArtifactExtended {
    const artifact = ArtifactStorage.get(bytecodeHash(bytecode));

    if (!artifact) {
      throw new MigrateError(`Artifact not found`);
    }

    return artifact;
  }

  public static getContractName(bytecode: Bytecode): string {
    const artifact = ArtifactStorage.get(bytecodeHash(bytecodeToString(bytecode))) as ArtifactExtended;

    if (!artifact) {
      throw new MigrateError(`Contract name not found`);
    }

    return `${artifact.sourceName}:${artifact.contractName}`;
  }
}

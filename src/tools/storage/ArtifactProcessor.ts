import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

import { ArtifactStorage } from "./MigrateStorage";

import { MigrateError } from "../../errors";

import { bytecodeHash, catchError } from "../../utils";

import { ArtifactExtended, NeededLibrary } from "../../types/deployer";

@catchError
export class ArtifactProcessor {
  public static async parseArtifacts(_hre: HardhatRuntimeEnvironment): Promise<void> {
    ArtifactStorage.clear();

    const names = await _hre.artifacts.getAllFullyQualifiedNames();

    for (const name of names) {
      const artifact = await _hre.artifacts.readArtifact(name);

      const contract: ArtifactExtended = { ...artifact, neededLibraries: this._parseLibrariesOfArtifact(artifact) };

      if (this._isNotDeployableArtifact(artifact)) {
        continue;
      }

      ArtifactStorage.set(name, contract);

      // Forcing the overwriting of the existing bytecode value in the Artifacts storage is necessary to prevent
      // failure in edge cases, such as with internal libraries
      ArtifactStorage.set(bytecodeHash(artifact.bytecode), contract, artifact.abi.length === 0);
    }
  }

  public static tryGetArtifactByName(contractName: string): ArtifactExtended {
    const artifact = ArtifactStorage.get(contractName);

    if (!artifact) {
      throw new MigrateError(`Artifact not found`);
    }

    return artifact;
  }

  public static tryGetArtifactByBytecode(bytecode: string): ArtifactExtended {
    const artifact = ArtifactStorage.get(bytecodeHash(bytecode));

    if (!artifact) {
      throw new MigrateError(`Artifact not found`);
    }

    return artifact;
  }

  public static tryGetContractName(bytecode: string): string {
    const artifact = this.tryGetArtifactByBytecode(bytecode);

    return `${artifact.sourceName}:${artifact.contractName}`;
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

  private static _isNotDeployableArtifact(artifact: Artifact): boolean {
    return artifact.deployedBytecode === "0x";
  }
}

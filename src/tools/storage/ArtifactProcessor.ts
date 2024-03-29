import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

import { isFullyQualifiedName } from "hardhat/utils/contract-names";

import { ArtifactStorage } from "./MigrateStorage";

import { MigrateError } from "../../errors";

import { bytecodeHash, catchError } from "../../utils";

import { ArtifactExtended, NeededLibrary } from "../../types/deployer";

@catchError
class BaseArtifactProcessor {
  public async parseArtifacts(_hre: HardhatRuntimeEnvironment): Promise<void> {
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
      // failure in edge cases, such as with internal libraries or disabled bytecode metadata hash generation.
      ArtifactStorage.set(bytecodeHash(artifact.bytecode), contract, true);
    }
  }

  public async saveArtifactIfNotExist(
    _hre: HardhatRuntimeEnvironment,
    contractName: string,
    bytecode?: string,
  ): Promise<void> {
    if (!isFullyQualifiedName(contractName) || (bytecode ? true : ArtifactStorage.get(bytecodeHash(bytecode!)))) {
      return;
    }

    const artifact = await _hre.artifacts.readArtifact(contractName);

    const contract: ArtifactExtended = { ...artifact, neededLibraries: this._parseLibrariesOfArtifact(artifact) };

    ArtifactStorage.set(bytecode ? bytecodeHash(bytecode) : bytecodeHash(artifact.bytecode), contract, true);
  }

  public tryGetArtifactByName(contractName: string): ArtifactExtended {
    const artifact = ArtifactStorage.get(contractName);

    if (!artifact) {
      throw new MigrateError(`Artifact not found`);
    }

    return artifact;
  }

  public tryGetArtifactByBytecode(bytecode: string): ArtifactExtended {
    const artifact = ArtifactStorage.get(bytecodeHash(bytecode));

    if (!artifact) {
      throw new MigrateError(`Artifact not found`);
    }

    return artifact;
  }

  public tryGetContractName(bytecode: string): string {
    const artifact = this.tryGetArtifactByBytecode(bytecode);

    return `${artifact.sourceName}:${artifact.contractName}`;
  }

  private _parseLibrariesOfArtifact(artifact: Artifact): NeededLibrary[] {
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

  private _isNotDeployableArtifact(artifact: Artifact): boolean {
    return artifact.deployedBytecode === "0x";
  }
}

export const ArtifactProcessor = new BaseArtifactProcessor();

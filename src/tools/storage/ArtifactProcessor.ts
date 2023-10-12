import { MigrateError } from "../../errors";

import { bytecodeHash, catchError } from "../../utils";

import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

import { ArtifactStorage } from "./Storage";

import { ArtifactExtended, Bytecode, NeededLibrary } from "../../types/deployer";

@catchError
export class ArtifactProcessor {
  public static async parseArtifacts(_hre: HardhatRuntimeEnvironment): Promise<void> {
    ArtifactStorage.clear();

    const names = await _hre.artifacts.getAllFullyQualifiedNames();

    for (const name of names) {
      const artifact = await _hre.artifacts.readArtifact(name);

      const contract: ArtifactExtended = { ...artifact, neededLibraries: this._parseLibrariesOfArtifact(artifact) };

      if (contract.bytecode === "0x") {
        continue;
      }

      ArtifactStorage.set(name, contract);
      ArtifactStorage.set(bytecodeHash(artifact.bytecode), contract);
    }
  }

  public static getExtendedArtifact(bytecode: string): ArtifactExtended {
    const artifact = ArtifactStorage.get(bytecodeHash(bytecode));

    if (!artifact) {
      throw new MigrateError(`Artifact not found`);
    }

    return artifact;
  }

  public static getContractName(bytecode: Bytecode): string {
    const artifact = ArtifactStorage.get(bytecodeHash(bytecode)) as ArtifactExtended;

    if (!artifact) {
      throw new MigrateError(`Contract name not found`);
    }

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
}

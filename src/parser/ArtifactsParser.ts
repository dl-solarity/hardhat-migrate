import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";
import { TemporaryStorage } from "../tools/storage/TemporaryStorage";
import { bytecodeHash } from "../utils";

interface NeededLibrary {
  sourceName: string;
  libName: string;
}

export interface ArtifactExtended extends Artifact {
  neededLibraries: NeededLibrary[];
}

export class ArtifactsParser {
  constructor(private _hre: HardhatRuntimeEnvironment) {}

  public async parseArtifacts(): Promise<void> {
    const names = await this._hre.artifacts.getAllFullyQualifiedNames();

    const storage = TemporaryStorage.getInstance();

    for (const name of names) {
      const artifact = await this._hre.artifacts.readArtifact(name);

      const contract: ArtifactExtended = { ...artifact, neededLibraries: this._parseLibrariesOfArtifact(artifact) };

      storage.save(name, contract);
      storage.save(bytecodeHash(artifact.bytecode), contract);
    }
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
}

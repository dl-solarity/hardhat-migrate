import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";
import { TemporaryStorage } from "../tools/storage/TemporaryStorage";

interface NeededLibrary {
  sourceName: string;
  libName: string;
}

export interface ArtifactExtended extends Artifact {
  neededLibraries: NeededLibrary[];
}

export class ArtifactsParser {
  public static async parseArtifacts(hre: HardhatRuntimeEnvironment) {
    const names = await hre.artifacts.getAllFullyQualifiedNames();

    const storage = TemporaryStorage.getInstance();

    for (const name of names) {
      const artifact = await hre.artifacts.readArtifact(name);

      const contract: ArtifactExtended = { ...artifact, neededLibraries: this._parseLibrariesOfArtifact(artifact) };

      storage.save(name, contract);
      storage.save(artifact.bytecode, contract);
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

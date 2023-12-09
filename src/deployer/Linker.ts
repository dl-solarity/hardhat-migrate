import { isAddress, resolveAddress } from "ethers";

import { Artifact, Libraries } from "hardhat/types";

import { MinimalContract } from "./MinimalContract";

import { MigrateError } from "../errors";

import { catchError } from "../utils";

import { MigrateConfig } from "../types/migrations";
import { ArtifactExtended, Link, NeededLibrary } from "../types/deployer";

import { reporter } from "../tools/reporters/Reporter";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";

@catchError
export class Linker {
  private static _config: MigrateConfig;

  public static setConfig(config: MigrateConfig): void {
    this._config = config;
  }

  public static isBytecodeNeedsLinking(bytecode: string): boolean {
    return bytecode.indexOf("__") === -1;
  }

  public static async tryLinkBytecode(contractName: string, bytecode: string, libraries: Libraries): Promise<string> {
    const artifact: ArtifactExtended = this._mustGetContractArtifact(contractName);
    const neededLibraries = artifact.neededLibraries;

    let linksToApply: Map<string, Link> = new Map();
    for (const [linkedLibraryName, linkedLibraryAddress] of Object.entries(libraries)) {
      const neededLibrary = this._mustGetNeededLibrary(neededLibraries, linkedLibraryName, linksToApply);

      const neededLibraryFQN = `${neededLibrary.sourceName}:${neededLibrary.libName}`;

      linksToApply.set(neededLibraryFQN, <Link>{
        sourceName: neededLibrary.sourceName,
        libraryName: neededLibrary.libName,
        address: await resolveAddress(linkedLibraryAddress),
      });
    }

    linksToApply = this._fillLinksToApply(bytecode, artifact, neededLibraries);

    if (linksToApply.size < neededLibraries.length) {
      const separatelyDeployedLibraries = await this._findMissingLibraries(
        neededLibraries.filter((lib) => !linksToApply.has(`${lib.sourceName}:${lib.libName}`)),
      );

      linksToApply = new Map([...linksToApply.entries(), ...separatelyDeployedLibraries.entries()]);

      this._validateLibrariesToLink(linksToApply, neededLibraries);
    }

    return this._linkBytecode(bytecode, artifact, [...linksToApply.values()]);
  }

  private static _mustGetNeededLibrary(
    neededLibraries: NeededLibrary[],
    libraryName: string,
    linksToApply: Map<string, Link>,
  ): NeededLibrary {
    const matchingNeededLibraries = neededLibraries.filter(
      (lib) => lib.libName === libraryName || `${lib.sourceName}:${lib.libName}` === libraryName,
    );

    return this._validateMatchedNeededLibraries(neededLibraries, matchingNeededLibraries, linksToApply);
  }

  private static _validateMatchedNeededLibraries(
    neededLibraries: NeededLibrary[],
    matchingNeededLibraries: NeededLibrary[],
    linksToApply: Map<string, Link>,
  ): NeededLibrary {
    if (matchingNeededLibraries.length === 0) {
      if (neededLibraries.length > 0) {
        const libraryFQNames = neededLibraries
          .map((lib) => `${lib.sourceName}:${lib.libName}`)
          .map((x) => `* ${x}`)
          .join("\n");

        throw new MigrateError(`The libraries needed are:\n${libraryFQNames}`);
      } else {
        throw new MigrateError("This contract doesn't need linking any libraries.");
      }
    }

    if (matchingNeededLibraries.length > 1) {
      const matchingNeededLibrariesFQNs = matchingNeededLibraries
        .map(({ sourceName, libName }) => `${sourceName}:${libName}`)
        .map((x) => `* ${x}`)
        .join("\n");
      throw new MigrateError(
        `The library name is ambiguous.\nIt may resolve to one of the following libraries:\n${matchingNeededLibrariesFQNs}\n\nTo fix this, choose one of these fully qualified library names and replace where appropriate.`,
      );
    }

    const neededLibrary = matchingNeededLibraries[0];

    const neededLibraryFQN = `${neededLibrary.sourceName}:${neededLibrary.libName}`;

    if (linksToApply.has(neededLibraryFQN)) {
      throw new MigrateError(
        `The library names ${neededLibrary.libName} and ${neededLibraryFQN} refer to the same library and were given as two separate library links.\nRemove one of them and review your library links before proceeding.`,
      );
    }

    return neededLibrary;
  }

  private static async _findMissingLibraries(
    missingLibraries: { sourceName: string; libName: string }[],
  ): Promise<Map<string, Link>> {
    const missingLibrariesMap: Map<string, Link> = new Map();

    for (const missingLibrary of missingLibraries) {
      const lib = `${missingLibrary.sourceName}:${missingLibrary.libName}`;
      const address = await this._getOrDeployLibrary(lib);

      if (isAddress(address)) {
        missingLibrariesMap.set(lib, {
          sourceName: missingLibrary.sourceName,
          libraryName: missingLibrary.libName,
          address: address,
        });
      }
    }

    return missingLibrariesMap;
  }

  private static _validateLibrariesToLink(linksToApply: Map<string, Link>, neededLibraries: NeededLibrary[]): void {
    if (linksToApply.size < neededLibraries.length) {
      const missingLibraries = neededLibraries
        .map((lib) => `${lib.sourceName}:${lib.libName}`)
        .filter((libFQName) => !linksToApply.has(libFQName))
        .map((x) => `* ${x}`)
        .join("\n");

      throw new MigrateError(`The contract is missing links for the following libraries:\n${missingLibraries}`);
    }
  }

  private static _fillLinksToApply(
    bytecode: string,
    artifact: Artifact,
    libraries: NeededLibrary[],
  ): Map<string, Link> {
    const linksToApplyFilled: Map<string, Link> = new Map();

    for (const { sourceName, libName } of libraries) {
      const linkReferences = artifact.linkReferences[sourceName][libName];

      for (const { start, length } of linkReferences) {
        const [isLinkedLibrary, address] = this._getLinkedLibrary(bytecode, start, length);

        if (isLinkedLibrary) {
          linksToApplyFilled.set(`${sourceName}:${libName}`, {
            sourceName: sourceName,
            libraryName: libName,
            address,
          });
        }
      }
    }

    return linksToApplyFilled;
  }

  private static _getLinkedLibrary(bytecode: string, start: number, length: number): [boolean, string] {
    const prefixLength = start * 2;
    const prefix = bytecode.slice(prefixLength + 2, prefixLength + 5);

    const suffixStart = (start + length) * 2;
    const suffix = bytecode.slice(suffixStart - 1, suffixStart + 2);

    const address = bytecode.slice(prefixLength + 2, suffixStart + 2);

    return [`${prefix}${suffix}` !== "__$$__", `0x${address}`];
  }

  private static _linkBytecode(bytecode: string, artifact: Artifact, libraries: Link[]): string {
    for (const { sourceName, libraryName, address } of libraries) {
      const linkReferences = artifact.linkReferences[sourceName][libraryName];

      for (const { start, length } of linkReferences) {
        const [isLinkedLibrary] = this._getLinkedLibrary(bytecode, start, length);

        if (isLinkedLibrary) {
          continue;
        }

        const prefixLength = 2 + start * 2;
        const prefix = bytecode.slice(0, prefixLength);

        const suffixStart = 2 + (start + length) * 2;
        const suffix = bytecode.slice(suffixStart);

        bytecode = prefix + address.slice(2) + suffix;
      }
    }

    return bytecode;
  }

  private static async _getOrDeployLibrary(libraryName: string) {
    try {
      return await TransactionProcessor.tryRestoreContractAddressByName(libraryName);
    } catch {
      const artifact = this._mustGetLibraryArtifact(libraryName);

      // https://github.com/ethers-io/ethers.js/issues/2431
      // https://github.com/ethers-io/ethers.js/issues/1126
      const core = new MinimalContract(this._config, artifact.bytecode, artifact.abi, libraryName);

      reporter!.notifyDeploymentOfMissingLibrary(libraryName);

      return core.deploy();
    }
  }

  private static _mustGetContractArtifact(contractName: string): ArtifactExtended {
    try {
      return ArtifactProcessor.tryGetArtifactByName(contractName);
    } catch {
      throw new MigrateError(`Contract artifact of ${contractName} not found. Linking cannot be performed.`);
    }
  }

  private static _mustGetLibraryArtifact(libraryName: string): ArtifactExtended {
    try {
      return ArtifactProcessor.tryGetArtifactByName(libraryName);
    } catch {
      throw new MigrateError(`Library artifact of ${libraryName} not found. Linking cannot be performed.`);
    }
  }
}

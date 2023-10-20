import { Interface, isAddress, resolveAddress } from "ethers";

import { Artifact, HardhatRuntimeEnvironment, Libraries } from "hardhat/types";

import { DeployerCore } from "./DeployerCore";

import { MigrateError } from "../errors";

import { bytecodeToString, catchError } from "../utils";

import { ArtifactExtended, Bytecode, ContractDeployParams, Link, NeededLibrary } from "../types/deployer";

import { Reporter } from "../tools/reporter/Reporter";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";

@catchError
export class Linker {
  public static validateBytecode(bytecode: Bytecode) {
    if (bytecodeToString(bytecode).indexOf("__") !== -1) {
      throw new MigrateError("Bytecode contains unresolved libraries.");
    }
  }

  public static async linkBytecode(
    hre: HardhatRuntimeEnvironment,
    bytecode: string,
    libraries: Libraries,
  ): Promise<string> {
    const artifact: ArtifactExtended = ArtifactProcessor.getExtendedArtifact(bytecode);
    const neededLibraries = artifact.neededLibraries;

    let linksToApply: Map<string, Link> = new Map();
    for (const [linkedLibraryName, linkedLibraryAddress] of Object.entries(libraries)) {
      const neededLibrary = this._matchNeededLibrary(neededLibraries, linkedLibraryName, linksToApply);

      const neededLibraryFQN = `${neededLibrary.sourceName}:${neededLibrary.libName}`;

      linksToApply.set(neededLibraryFQN, <Link>{
        sourceName: neededLibrary.sourceName,
        libraryName: neededLibrary.libName,
        address: await resolveAddress(linkedLibraryAddress),
      });
    }

    if (linksToApply.size < neededLibraries.length) {
      const separatelyDeployedLibraries = await this._findMissingLibraries(
        hre,
        neededLibraries.filter((lib) => !linksToApply.has(`${lib.sourceName}:${lib.libName}`)),
      );

      linksToApply = new Map([...linksToApply.entries(), ...separatelyDeployedLibraries.entries()]);

      this._validateLibrariesToLink(linksToApply, neededLibraries);
    }

    return this._linkBytecode(bytecode, artifact, [...linksToApply.values()]);
  }

  private static _matchNeededLibrary(
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
    hre: HardhatRuntimeEnvironment,
    missingLibraries: { sourceName: string; libName: string }[],
  ): Promise<Map<string, Link>> {
    const missingLibrariesMap: Map<string, Link> = new Map();

    for (const missingLibrary of missingLibraries) {
      const lib = `${missingLibrary.sourceName}:${missingLibrary.libName}`;
      const address = await this._getOrDeployLibrary(hre, lib);

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

  private static _linkBytecode(bytecode: string, artifact: Artifact, libraries: Link[]): string {
    for (const { sourceName, libraryName, address } of libraries) {
      const linkReferences = artifact.linkReferences[sourceName][libraryName];
      for (const { start, length } of linkReferences) {
        const prefixLength = 2 + start * 2;
        const prefix = bytecode.slice(0, prefixLength);

        const suffixStart = 2 + (start + length) * 2;
        const suffix = bytecode.slice(suffixStart);

        bytecode = prefix + address.slice(2) + suffix;
      }
    }

    return bytecode;
  }

  private static async _getOrDeployLibrary(hre: HardhatRuntimeEnvironment, libraryName: string) {
    try {
      return TransactionProcessor.tryRestoreContractAddressByName(libraryName);
    } catch {
      const artifact = ArtifactProcessor.getArtifact(libraryName);

      const core = new DeployerCore(hre);

      const deployParams: ContractDeployParams = {
        abi: Interface.from(artifact.abi),
        bytecode: artifact.bytecode,
      };

      Reporter.notifyDeploymentOfMissingLibrary(libraryName);

      return core.deploy(deployParams, [], {});
    }
  }
}

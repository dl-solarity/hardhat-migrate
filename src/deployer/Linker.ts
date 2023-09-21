import { Artifact, Libraries } from "hardhat/types";
import { ArtifactExtended } from "../parser/ArtifactsParser";
import { TemporaryStorage } from "../tools/storage/TemporaryStorage";
import { bytecodeHash, bytecodeToString } from "../utils";
import { isAddress, isAddressable } from "ethers";
import { MigrateError } from "../errors";
import { TransactionStorage } from "../tools/storage/TransactionStorage";
import { Bytecode } from "../types/deployer";

export class Linker {
  protected async _link(bytecode: string, libraries: Libraries): Promise<string> {
    // TODO: add getter function for ArtifactExtended and NeededLibrary. Optimise to do not use Storage multiple times.
    const artifact: ArtifactExtended = TemporaryStorage.getInstance().get(bytecodeHash(bytecode)) as ArtifactExtended;
    const neededLibraries = artifact.neededLibraries;

    let linksToApply: Map<string, Link> = new Map();
    for (const [linkedLibraryName, linkedLibraryAddress] of Object.entries(libraries)) {
      // TODO: add resolve address function
      let resolvedAddress: string;
      if (isAddressable(linkedLibraryAddress)) {
        resolvedAddress = await linkedLibraryAddress.getAddress();
      } else {
        resolvedAddress = linkedLibraryAddress as string;
      }

      // TODO: add validation function (e.g. validateAddress) that will throw error if address is invalid
      if (!isAddress(resolvedAddress)) {
        throw new MigrateError(
          `You tried to link the contract ${
            artifact.contractName
          } with the library ${linkedLibraryName}, but provided this invalid address: ${resolvedAddress as any}`,
        );
      }

      // TODO: Add getter function for matchingNeededLibraries
      const matchingNeededLibraries = neededLibraries.filter((lib) => {
        return lib.libName === linkedLibraryName || `${lib.sourceName}:${lib.libName}` === linkedLibraryName;
      });

      // TODO: move to separate function (same as validateAddress)
      if (matchingNeededLibraries.length === 0) {
        let detailedMessage: string;
        if (neededLibraries.length > 0) {
          const libraryFQNames = neededLibraries
            .map((lib) => `${lib.sourceName}:${lib.libName}`)
            .map((x) => `* ${x}`)
            .join("\n");
          detailedMessage = `The libraries needed are:
  ${libraryFQNames}`;
        } else {
          detailedMessage = "This contract doesn't need linking any libraries.";
        }
        throw new MigrateError(
          `You tried to link the contract ${artifact.contractName} with ${linkedLibraryName}, which is not one of its libraries.
  ${detailedMessage}`,
        );
      }

      // TODO: move to separate function (same as validateAddress)
      if (matchingNeededLibraries.length > 1) {
        const matchingNeededLibrariesFQNs = matchingNeededLibraries
          .map(({ sourceName, libName }) => `${sourceName}:${libName}`)
          .map((x) => `* ${x}`)
          .join("\n");
        throw new MigrateError(
          `The library name ${linkedLibraryName} is ambiguous for the contract ${artifact.contractName}.
  It may resolve to one of the following libraries:
  ${matchingNeededLibrariesFQNs}

  To fix this, choose one of these fully qualified library names and replace where appropriate.`,
        );
      }

      const [neededLibrary] = matchingNeededLibraries;

      const neededLibraryFQN = `${neededLibrary.sourceName}:${neededLibrary.libName}`;

      // The only way for this library to be already mapped is
      // for it to be given twice in the libraries user input:
      // once as a library name and another as a fully qualified library name.
      // TODO: move to separate function (same as validateAddress)
      if (linksToApply.has(neededLibraryFQN)) {
        throw new MigrateError(
          `The library names ${neededLibrary.libName} and ${neededLibraryFQN} refer to the same library and were given as two separate library links.
  Remove one of them and review your library links before proceeding.`,
        );
      }

      linksToApply.set(neededLibraryFQN, {
        sourceName: neededLibrary.sourceName,
        libraryName: neededLibrary.libName,
        address: resolvedAddress,
      });
    }

    // TODO: move to separate function (same as validateAddress)
    if (linksToApply.size < neededLibraries.length) {
      const separatelyDeployedLibraries = this._findMissingLibraries(
        neededLibraries.filter((lib) => !linksToApply.has(`${lib.sourceName}:${lib.libName}`)),
      );

      linksToApply = new Map([...linksToApply.entries(), ...separatelyDeployedLibraries.entries()]);
      if (linksToApply.size < neededLibraries.length) {
        const missingLibraries = neededLibraries
          .map((lib) => `${lib.sourceName}:${lib.libName}`)
          .filter((libFQName) => !linksToApply.has(libFQName))
          .map((x) => `* ${x}`)
          .join("\n");

        throw new MigrateError(
          `The contract ${artifact.contractName} is missing links for the following libraries:
${missingLibraries}
  
Learn more about linking contracts at https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-ethers#library-linking
    `,
        );
      }
    }

    return this.linkBytecode(bytecode, artifact, [...linksToApply.values()]);
  }

  private _findMissingLibraries(missingLibraries: { sourceName: string; libName: string }[]): Map<string, Link> {
    const missingLibrariesMap: Map<string, Link> = new Map();

    for (const missingLibrary of missingLibraries) {
      const lib = `${missingLibrary.sourceName}:${missingLibrary.libName}`;
      const address = TransactionStorage.getInstance().getDeploymentTransactionByName(lib);

      if (address) {
        missingLibrariesMap.set(lib, {
          sourceName: missingLibrary.sourceName,
          libraryName: missingLibrary.libName,
          address,
        });
      }
    }

    return missingLibrariesMap;
  }

  private linkBytecode(bytecode: string, artifact: Artifact, libraries: Link[]): string {
    for (const { sourceName, libraryName, address } of libraries) {
      const linkReferences = artifact.linkReferences[sourceName][libraryName];
      for (const { start, length } of linkReferences) {
        // TODO: fix waarning
        // Deprecated symbol used, consult docs for better alternative
        // TS6387: The signature
        // (from: number, length?: number | undefined): string
        // of bytecode.substr is deprecated.
        bytecode = bytecode.substr(0, 2 + start * 2) + address.substr(2) + bytecode.substr(2 + (start + length) * 2);
      }
    }

    return bytecode;
  }

  public static validateBytecode(bytecode: Bytecode): boolean {
    const bytecodeString = bytecode.toString();

    return bytecodeString.indexOf("__") === -1;
  }
}

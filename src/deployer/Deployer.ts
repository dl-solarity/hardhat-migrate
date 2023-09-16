import { DeployerCore } from "./DeployerCore";

import { EthersAdapter } from "./adapters/EthersAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

import { catchError } from "../utils";

import { ContractDeployTransaction, Overrides } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MigrateError } from "../errors";
import { TransactionStorage } from "../tools/storage/TransactionStorage";
import { Adapter, Instance } from "../types/adapter";
import { Args, ContractDeployParams } from "../types/deployer";
import { PluginName } from "../types/migrations";

@catchError
export class Deployer {
  private _adapter: Adapter;

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _deployerType: PluginName,
    private _core = new DeployerCore(_hre),
  ) {
    switch (this._deployerType) {
      case PluginName.ETHERS:
        this._adapter = new EthersAdapter(this._hre);
        break;
      case PluginName.TRUFFLE:
        this._adapter = new TruffleAdapter(this._hre);
        break;
      default:
        throw new MigrateError(`Invalid deployer type: ${this._deployerType}`);
    }
  }

  public async deploy<A, I>(contract: Instance<A, I>, args: Args, txOverrides: Overrides = {}): Promise<I> {
    const deploymentParams = this._adapter.getContractDeployParams(contract);

    const [contractAddress, tx] = await this._core.deploy(deploymentParams, args, txOverrides);
    if (tx) {
      this._cacheContractAddress(deploymentParams, tx, contractAddress);
    }

    return this._adapter.toInstance(contract, contractAddress, await this._core.getSigner(txOverrides.from));
  }

  // eslint-disable-next-line
  public link(library: any, instance: any): void {
    this._adapter.linkLibrary(library, instance);
  }

  private _cacheContractAddress(
    deploymentParams: ContractDeployParams,
    tx: ContractDeployTransaction,
    address: string,
  ) {
    const transactionStorage = TransactionStorage.getInstance();

    transactionStorage.saveDeploymentTransaction(tx, address);

    const contractName = deploymentParams.contractName;
    if (contractName) {
      transactionStorage.saveDeploymentTransactionByName(contractName, address);
    }
  }
}

// async function collectLibrariesAndLink(artifact: Artifact, libraries: Libraries) {
//   const neededLibraries: Array<{
//     sourceName: string;
//     libName: string;
//   }> = [];

//   for (const [sourceName, sourceLibraries] of Object.entries(artifact.linkReferences)) {
//     for (const libName of Object.keys(sourceLibraries)) {
//       neededLibraries.push({ sourceName, libName });
//     }
//   }

//   const linksToApply: Map<string, Link> = new Map();
//   for (const [linkedLibraryName, linkedLibraryAddress] of Object.entries(libraries)) {
//     let resolvedAddress: string;
//     if (isAddressable(linkedLibraryAddress)) {
//       resolvedAddress = await linkedLibraryAddress.getAddress();
//     } else {
//       resolvedAddress = linkedLibraryAddress as string;
//     }

//     if (!isAddress(resolvedAddress)) {
//       throw new MigrateError(
//         `You tried to link the contract ${
//           artifact.contractName
//         } with the library ${linkedLibraryName}, but provided this invalid address: ${resolvedAddress as any}`,
//       );
//     }

//     const matchingNeededLibraries = neededLibraries.filter((lib) => {
//       return lib.libName === linkedLibraryName || `${lib.sourceName}:${lib.libName}` === linkedLibraryName;
//     });

//     if (matchingNeededLibraries.length === 0) {
//       let detailedMessage: string;
//       if (neededLibraries.length > 0) {
//         const libraryFQNames = neededLibraries
//           .map((lib) => `${lib.sourceName}:${lib.libName}`)
//           .map((x) => `* ${x}`)
//           .join("\n");
//         detailedMessage = `The libraries needed are:
// ${libraryFQNames}`;
//       } else {
//         detailedMessage = "This contract doesn't need linking any libraries.";
//       }
//       throw new MigrateError(
//         `You tried to link the contract ${artifact.contractName} with ${linkedLibraryName}, which is not one of its libraries.
// ${detailedMessage}`,
//       );
//     }

//     if (matchingNeededLibraries.length > 1) {
//       const matchingNeededLibrariesFQNs = matchingNeededLibraries
//         .map(({ sourceName, libName }) => `${sourceName}:${libName}`)
//         .map((x) => `* ${x}`)
//         .join("\n");
//       throw new MigrateError(
//         `The library name ${linkedLibraryName} is ambiguous for the contract ${artifact.contractName}.
// It may resolve to one of the following libraries:
// ${matchingNeededLibrariesFQNs}

// To fix this, choose one of these fully qualified library names and replace where appropriate.`,
//       );
//     }

//     const [neededLibrary] = matchingNeededLibraries;

//     const neededLibraryFQN = `${neededLibrary.sourceName}:${neededLibrary.libName}`;

//     // The only way for this library to be already mapped is
//     // for it to be given twice in the libraries user input:
//     // once as a library name and another as a fully qualified library name.
//     if (linksToApply.has(neededLibraryFQN)) {
//       throw new MigrateError(
//         `The library names ${neededLibrary.libName} and ${neededLibraryFQN} refer to the same library and were given as two separate library links.
// Remove one of them and review your library links before proceeding.`,
//       );
//     }

//     linksToApply.set(neededLibraryFQN, {
//       sourceName: neededLibrary.sourceName,
//       libraryName: neededLibrary.libName,
//       address: resolvedAddress,
//     });
//   }

//   if (linksToApply.size < neededLibraries.length) {
//     const missingLibraries = neededLibraries
//       .map((lib) => `${lib.sourceName}:${lib.libName}`)
//       .filter((libFQName) => !linksToApply.has(libFQName))
//       .map((x) => `* ${x}`)
//       .join("\n");

//     throw new MigrateError(
//       `The contract ${artifact.contractName} is missing links for the following libraries:
// ${missingLibraries}

// Learn more about linking contracts at https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-ethers#library-linking
// `,
//     );
//   }

//   return linkBytecode(artifact, [...linksToApply.values()]);
// }
// interface Link {
//   sourceName: string;
//   libraryName: string;
//   address: string;
// }

// function linkBytecode(artifact: Artifact, libraries: Link[]): string {
//   let bytecode = artifact.bytecode;

//   for (const { sourceName, libraryName, address } of libraries) {
//     const linkReferences = artifact.linkReferences[sourceName][libraryName];
//     for (const { start, length } of linkReferences) {
//       bytecode = bytecode.substr(0, 2 + start * 2) + address.substr(2) + bytecode.substr(2 + (start + length) * 2);
//     }
//   }

//   return bytecode;
// }

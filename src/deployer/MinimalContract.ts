import { ethers, InterfaceAbi, Overrides, Signer } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { isFullyQualifiedName } from "hardhat/utils/contract-names";

import { Linker } from "./Linker";

import { catchError, fillParameters, getChainId, getInterfaceOnlyWithConstructor } from "../utils";

import { MigrateError } from "../errors";

import { MigrationMetadata } from "../types/tools";
import { ContractDeployTxWithName, OverridesAndLibs } from "../types/deployer";

import { Stats } from "../tools/Stats";
import { Reporter } from "../tools/reporters/Reporter";
import { networkManager } from "../tools/network/NetworkManager";
import { TransactionRunner } from "../tools/runners/TransactionRunner";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";
import { VerificationProcessor } from "../tools/storage/VerificationProcessor";

@catchError
export class MinimalContract {
  private readonly _rawBytecode: string;
  private readonly _interface;

  constructor(
    private readonly _hre: HardhatRuntimeEnvironment,
    private _bytecode: string,
    private readonly _abi: InterfaceAbi,
    private readonly _contractName: string = "",
  ) {
    this._interface = getInterfaceOnlyWithConstructor(this._abi);
    this._rawBytecode = this._bytecode;

    if (_contractName === "") {
      try {
        this._contractName = ArtifactProcessor.tryGetContractName(_bytecode);
      } catch {
        throw new MigrateError("Contract name is not provided and cannot be extracted from bytecode.");
      }
    }
  }

  public async deploy(args: any[] = [], parameters: OverridesAndLibs = {}): Promise<string> {
    await fillParameters(parameters);

    await this._tryLinkLibraries(parameters);

    const tx = await this._createDeployTransaction(args, parameters);

    if (this._hre.config.migrate.continue) {
      return this._recoverContractAddress(tx, args);
    } else {
      return this._processContractDeploymentTransaction(tx, args);
    }
  }

  private async _tryLinkLibraries(parameters: OverridesAndLibs): Promise<void> {
    try {
      if (Linker?.isBytecodeNeedsLinking(this._bytecode)) {
        return;
      }

      this._bytecode = (await Linker?.tryLinkBytecode(this._contractName, this._bytecode, parameters.libraries || {}))!;
    } catch (e: any) {
      throw new MigrateError(
        `Unable to link libraries for ${this._contractName}! Try manually deploy the libraries and link them.\n Error: ${e.message}`,
      );
    }
  }

  private async _createDeployTransaction(args: any[], txOverrides: Overrides): Promise<ContractDeployTxWithName> {
    const factory = new ethers.ContractFactory(this._interface, this._bytecode);

    return {
      contractName: this._contractName,
      chainId: await getChainId(),
      from: (await networkManager!.getSigner(txOverrides.from)).address,
      ...(await factory.getDeployTransaction(...args, txOverrides)),
    };
  }

  private async _recoverContractAddress(tx: ContractDeployTxWithName, args: any[]): Promise<string> {
    try {
      const contractAddress = await TransactionProcessor?.tryRestoreContractAddressByKeyFields(tx);

      Reporter!.notifyContractRecovery(tx.contractName, contractAddress!);

      await this._saveContractForVerification(contractAddress!, tx, args);

      return contractAddress!;
    } catch {
      /* empty */
    }

    Reporter!.notifyDeploymentInsteadOfRecovery(tx.contractName);

    return this._processContractDeploymentTransaction(tx, args);
  }

  private async _processContractDeploymentTransaction(tx: ContractDeployTxWithName, args: any[]): Promise<string> {
    const signer: Signer = await networkManager!.getSigner(tx.from);

    const txResponse = await signer.sendTransaction(tx);

    await TransactionRunner!.reportTransactionResponse(txResponse, tx.contractName);

    const contractAddress = (await txResponse.wait(0))!.contractAddress;

    if (typeof contractAddress !== "string") {
      throw new MigrateError("Contract deployment failed. Invalid contract address conversion.");
    }

    await this._saveContractForVerification(contractAddress, tx, args);

    const saveMetadata: MigrationMetadata = {
      migrationNumber: Stats.currentMigration,
      contractName: tx.contractName,
      fullyQualifiedContractName: this._getFullyQualifiedName(tx) || undefined,
    };

    TransactionProcessor?.saveDeploymentTransaction(tx, tx.contractName, contractAddress, saveMetadata);

    return contractAddress;
  }

  private async _saveContractForVerification(contractAddress: string, tx: ContractDeployTxWithName, args: any[]) {
    if (VerificationProcessor.isVerificationDataSaved(contractAddress)) {
      return;
    }

    const contractName = this._getFullyQualifiedName(tx);

    if (contractName === null) {
      Reporter!.reportVerificationFailedToSave(tx.contractName);

      return;
    }

    VerificationProcessor.saveVerificationFunction({
      contractAddress,
      contractName: contractName,
      constructorArguments: args,
      chainId: Number(await getChainId()),
    });

    await ArtifactProcessor.saveArtifactIfNotExist(this._hre, contractName, this._rawBytecode);
  }

  private _getFullyQualifiedName(tx: ContractDeployTxWithName): string | null {
    try {
      if (!isFullyQualifiedName(tx.contractName)) {
        return ArtifactProcessor.tryGetContractName(this._rawBytecode);
      }

      return tx.contractName;
    } catch {
      return null;
    }
  }
}

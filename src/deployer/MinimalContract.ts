import { ethers, Interface, Overrides, Signer } from "ethers";

import { Linker } from "./Linker";

import { catchError, fillParameters, getChainId, getSignerHelper } from "../utils";

import { MigrateError } from "../errors";

import { MigrateConfig } from "../types/migrations";
import { ContractDeployTransactionWithContractName, OverridesAndLibs } from "../types/deployer";

import { Reporter } from "../tools/reporters/Reporter";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";
import { VerificationProcessor } from "../tools/storage/VerificationProcessor";

@catchError
export class MinimalContract {
  constructor(
    private readonly _config: MigrateConfig,
    private _bytecode: string,
    private readonly _interface: Interface,
    private readonly _contractName: string = "",
  ) {
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

    if (this._config.continue) {
      return this._recoverContractAddress(tx, args);
    } else {
      return this._processContractDeploymentTransaction(tx, args);
    }
  }

  private async _tryLinkLibraries(parameters: OverridesAndLibs): Promise<void> {
    try {
      if (Linker.isBytecodeNeedsLinking(this._bytecode)) {
        return;
      }

      this._bytecode = await Linker.tryLinkBytecode(this._contractName, this._bytecode, parameters.libraries || {});
    } catch (e: any) {
      throw new MigrateError(
        `Unable to link libraries for ${this._contractName}! Try manually deploy the libraries and link them.\n Error: ${e.message}`,
      );
    }
  }

  private async _createDeployTransaction(
    args: any[],
    txOverrides: Overrides,
  ): Promise<ContractDeployTransactionWithContractName> {
    const factory = new ethers.ContractFactory(this._interface, this._bytecode);

    return {
      contractName: this._contractName,
      chainId: await getChainId(),
      from: (await getSignerHelper(txOverrides.from)).address,
      ...(await factory.getDeployTransaction(...args, txOverrides)),
    };
  }

  private async _recoverContractAddress(tx: ContractDeployTransactionWithContractName, args: any[]): Promise<string> {
    try {
      const contractAddress = await TransactionProcessor.tryRestoreContractAddressByName(tx.contractName);

      Reporter.notifyContractRecovery(tx.contractName, contractAddress);

      return contractAddress;
    } catch {
      /* empty */
    }

    try {
      const contractAddress = await TransactionProcessor.tryRestoreContractAddressByKeyFields(tx);

      Reporter.notifyContractRecovery(tx.contractName, contractAddress);

      return contractAddress;
    } catch {
      /* empty */
    }

    Reporter.notifyDeploymentInsteadOfRecovery(tx.contractName);

    return this._processContractDeploymentTransaction(tx, args);
  }

  private async _processContractDeploymentTransaction(
    tx: ContractDeployTransactionWithContractName,
    args: any[],
  ): Promise<string> {
    const signer: Signer = await getSignerHelper(tx.from);

    const txResponse = await signer.sendTransaction(tx);

    await Reporter.reportTransaction(txResponse, tx.contractName);

    const contractAddress = (await txResponse.wait(0))!.contractAddress;

    if (typeof contractAddress !== "string") {
      throw new MigrateError("Contract deployment failed. Invalid contract address conversion.");
    }

    TransactionProcessor.saveDeploymentTransaction(tx, tx.contractName, contractAddress);

    VerificationProcessor.saveVerificationFunction({
      contractAddress,
      contractName: tx.contractName,
      constructorArguments: args,
      chainId: Number(await getChainId()),
    });

    return contractAddress;
  }
}

import { Interface, Overrides, Signer, TransactionResponse } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Linker } from "./Linker";

import { catchError, fillParameters, getChainId, getSignerHelper } from "../utils";

import { MigrateError } from "../errors";

import { ContractDeployTransactionWithContractName, OverridesAndLibs } from "../types/deployer";
import { MigrateConfig } from "../types/migrations";

import { Verifier } from "../verifier/Verifier";

import { Reporter } from "../tools/reporters/Reporter";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";
import { VerificationProcessor } from "../tools/storage/VerificationProcessor";

@catchError
export class MinimalContract {
  private _verifier: Verifier;
  private _config: MigrateConfig;

  constructor(
    private readonly _hre: HardhatRuntimeEnvironment,
    private _bytecode: string,
    private readonly _interface: Interface,
    private readonly _contractName: string = "",
  ) {
    this._config = _hre.config.migrate;
    this._verifier = new Verifier(_hre, {
      parallel: this._config.verifyParallel,
      attempts: this._config.verifyAttempts,
    });

    if (_contractName === "") {
      try {
        this._contractName = ArtifactProcessor.tryGetContractName(_bytecode);
      } catch {
        throw new MigrateError("Contract name is not provided and cannot be extracted from bytecode.");
      }
    }
  }

  public async deploy(args: any[] = [], parameters: OverridesAndLibs = {}): Promise<string> {
    await fillParameters(this._hre, parameters);

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

      this._bytecode = await Linker.tryLinkBytecode(
        this._hre,
        this._contractName,
        this._bytecode,
        parameters.libraries || {},
      );
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
    const factory = new this._hre.ethers.ContractFactory(this._interface, this._bytecode);

    // check opportunity to use the populateTransaction method
    return {
      contractName: this._contractName,
      chainId: await getChainId(this._hre),
      from: (await getSignerHelper(this._hre, txOverrides.from)).address,
      ...(await factory.getDeployTransaction(...args, txOverrides)),
    };
  }

  private async _recoverContractAddress(tx: ContractDeployTransactionWithContractName, args: any[]): Promise<string> {
    try {
      const contractAddress = await TransactionProcessor.tryRestoreContractAddressByKeyFields(tx, this._hre);

      Reporter.notifyContractRecovery(tx.contractName, contractAddress);

      return contractAddress;
    } catch {
      Reporter.notifyDeploymentInsteadOfRecovery(tx.contractName);

      return this._processContractDeploymentTransaction(tx, args);
    }
  }

  private async _processContractDeploymentTransaction(
    tx: ContractDeployTransactionWithContractName,
    args: any[],
  ): Promise<string> {
    const signer: Signer = await getSignerHelper(this._hre, tx.from);

    const txResponse = await signer.sendTransaction(tx);

    const [contractAddress] = await Promise.all([
      this._waitForDeployment(txResponse),
      Reporter.reportTransaction(txResponse, tx.contractName),
    ]);

    if (typeof contractAddress !== "string") {
      throw new MigrateError("Contract deployment failed. Invalid contract address conversion.");
    }

    TransactionProcessor.saveDeploymentTransaction(tx, tx.contractName, contractAddress);

    VerificationProcessor.saveVerificationFunction({
      contractAddress,
      contractName: tx.contractName,
      constructorArguments: args,
      chainId: Number(await getChainId(this._hre)),
    });

    return contractAddress;
  }

  private async _waitForDeployment(tx: TransactionResponse): Promise<string> {
    const receipt = await tx.wait(this._config.wait);

    if (receipt) {
      return receipt.contractAddress!;
    }

    throw new MigrateError("Contract deployment failed.");
  }
}

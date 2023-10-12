import { ContractDeployTransaction, Overrides, Signer, TransactionResponse, isAddress } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Linker } from "./Linker";

import { catchError, getSignerHelper } from "../utils";

import { MigrateError } from "../errors";

import {
  Args,
  ContractDeployParams,
  ContractDeployTransactionWithContractName,
  OverridesAndLibs,
} from "../types/deployer";
import { MigrateConfig } from "../types/migrations";

import { Reporter } from "../tools/reporter/Reporter";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";

@catchError
export class DeployerCore {
  private _config: MigrateConfig;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
  }

  public async deploy(deployParams: ContractDeployParams, args: Args, parameters: OverridesAndLibs): Promise<string> {
    const contractName = ArtifactProcessor.getContractName(deployParams.bytecode);

    deployParams.bytecode = await Linker.linkBytecode(deployParams.bytecode, parameters.libraries || {});

    const tx: ContractDeployTransactionWithContractName = {
      ...(await this._createDeployTransaction(deployParams, args, parameters)),
      contractName: contractName,
    };

    let contractAddress: string;
    if (this._config.continuePreviousDeployment) {
      contractAddress = await this._tryRecoverContractAddress(tx);
    } else {
      contractAddress = await this._processContractDeploymentTransaction(tx);
    }

    // TODO: Add verification step here.

    return contractAddress;
  }

  private async _createDeployTransaction(
    contractParams: ContractDeployParams,
    args: Args,
    txOverrides: Overrides,
  ): Promise<ContractDeployTransaction> {
    const factory = new this._hre.ethers.ContractFactory(contractParams.abi, contractParams.bytecode);

    return factory.getDeployTransaction(...args, txOverrides);
  }

  private async _tryRecoverContractAddress(tx: ContractDeployTransactionWithContractName): Promise<string> {
    let contractAddress;
    try {
      contractAddress = TransactionProcessor.restoreSavedDeployTransaction(tx);
    } catch (e) {
      Reporter.getInstance().notifyDeploymentInsteadOfRecovery(tx.contractName);

      return this._processContractDeploymentTransaction(tx);
    }

    if (!isAddress(contractAddress)) {
      throw new MigrateError(`Invalid address located in the storage: ${contractAddress}`);
    }

    Reporter.getInstance().notifyContractRecovery(tx.contractName, contractAddress);

    return contractAddress;
  }

  private async _processContractDeploymentTransaction(tx: ContractDeployTransactionWithContractName): Promise<string> {
    const signer: Signer = await getSignerHelper(this._hre, tx.from);

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);

    const [contractAddress] = await Promise.all([
      this._waitForDeployment(txResponse),
      Reporter.getInstance().reportTransaction(txResponse, tx.contractName),
    ]);

    TransactionProcessor.saveDeploymentTransaction(tx, tx.contractName, contractAddress);

    return contractAddress;
  }

  private async _waitForDeployment(tx: TransactionResponse): Promise<string> {
    // this._config.confirmations -- is used only for verification process.
    // TODO: Create other parameter to pass to tx.wait(). Default must be 1
    const receipt = await tx.wait();

    if (receipt) {
      return receipt.contractAddress!;
    }

    throw new MigrateError("Contract deployment failed.");
  }
}

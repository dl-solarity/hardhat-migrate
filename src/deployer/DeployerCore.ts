import { ContractDeployTransaction, Overrides, Signer, TransactionRequest, TransactionResponse } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { catchError, getSignerHelper } from "../utils";

import { MigrateError } from "../errors";

import { MigrateConfig } from "../types/migrations";
import { Args, ContractDeployParams } from "../types/deployer";

import { TransactionStorage } from "../tools/storage/TransactionStorage";

@catchError
export class DeployerCore {
  private _config: MigrateConfig;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
  }

  public async deploy(deployParams: ContractDeployParams, args: Args, txOverrides: Overrides = {}): Promise<string> {
    // TODO: Add bytecode validation here. It should be implemented through Linker class.
    const tx = await this._createDeployTransaction(deployParams, args, txOverrides);

    // TODO: Add special flag continue to the config.
    // If continue flag is true, only then we will use storage to recover contract addresses.
    const mockedContinueFlag = false;

    let contractAddress: string;
    if (mockedContinueFlag) {
      contractAddress = await this._tryRecoverContractAddress(tx);
    } else {
      contractAddress = await this._processContractDeploymentTransaction(tx);
    }

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

  private async _tryRecoverContractAddress(tx: ContractDeployTransaction): Promise<string> {
    try {
      return TransactionStorage.getInstance().getDeploymentTransaction(tx);
    } catch (e) {
      // TODO: Add reporter call here. Notify user that contract will be deployed instead of recovering.
      return this._processContractDeploymentTransaction(tx);
    }
  }

  private async _processContractDeploymentTransaction(tx: TransactionRequest): Promise<string> {
    const signer: Signer = await getSignerHelper(this._hre, tx.from);

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);

    const [contractAddress] = await Promise.all([
      this._waitForDeployment(txResponse),
      this._reportContractDeployTransactionSent(txResponse),
    ]);

    // TODO: Save transaction to storage. Just one function call to the Storage contract.

    return contractAddress;
  }

  private async _waitForDeployment(tx: TransactionResponse): Promise<string> {
    // this._config.confirmations -- is used only for verification process.
    // TODO: Create other parameter to pass to tx.wait(). Default must be 1
    const receipt = await tx.wait();

    if (receipt) {
      return receipt.contractAddress!;
    }

    // TODO: change message. It can not failed because of confirmations.
    throw new MigrateError("Contract deployment failed. Please check your network configuration (confirmations).");
  }

  // eslint-disable-next-line
  private async _reportContractDeployTransactionSent(tx: TransactionResponse): Promise<void> {
    // TODO: implement when reporter is ready. Must be inlined with call to the Reporter contract.
    // this function (_reportContractDeployTransactionSent) is not needed in this class. Must be handled by the Reporter.
  }
}

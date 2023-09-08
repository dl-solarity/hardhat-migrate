import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { AddressLike, Overrides, Signer, TransactionRequest, TransactionResponse } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { catchError } from "../utils";

import { MigrateError } from "../errors";

import { MigrateConfig } from "../types/migrations";
import { Args, ContractDeployParams } from "../types/deployer";

export class DeployerCore {
  private _config: MigrateConfig;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
  }

  @catchError
  public async deploy(deployParams: ContractDeployParams, args: Args, txOverrides: Overrides = {}): Promise<string> {
    const tx = await this._deploy(deployParams, args, txOverrides);

    const contractAddress = (
      await Promise.all([this._reportContractDeployTransactionSent(tx), this._waitForDeployment(tx)])
    )[1];

    return contractAddress;
  }

  @catchError
  public async getSigner(from?: null | AddressLike): Promise<HardhatEthersSigner> {
    if (!from) {
      return await this._hre.ethers.provider.getSigner();
    }

    const address = await this._hre.ethers.resolveAddress(from, this._hre.ethers.provider);

    return this._hre.ethers.provider.getSigner(address);
  }

  @catchError
  protected async _deploy(
    deployParams: ContractDeployParams,
    args: Args,
    txOverrides: Overrides,
  ): Promise<TransactionResponse> {
    const signer: Signer = await this.getSigner(txOverrides.from);

    const tx = await this._createDeployTransaction(deployParams, args, txOverrides);

    return signer.sendTransaction(tx);
  }

  @catchError
  protected async _waitForDeployment(tx: TransactionResponse): Promise<string> {
    const receipt = await tx.wait(this._config.confirmations);

    if (receipt) {
      return receipt.contractAddress!;
    }

    throw new MigrateError("Contract deployment failed. Please check your network configuration (confirmations).");
  }

  @catchError
  protected async _reportContractDeployTransactionSent(tx: TransactionResponse): Promise<void> {
    // TODO: implement when reporter is ready
  }

  @catchError
  protected async _createDeployTransaction(
    contractParams: ContractDeployParams,
    args: Args,
    txOverrides: Overrides,
  ): Promise<TransactionRequest> {
    const factory = new this._hre.ethers.ContractFactory(contractParams.abi, contractParams.bytecode);

    return factory.getDeployTransaction(...args, txOverrides);
  }
}

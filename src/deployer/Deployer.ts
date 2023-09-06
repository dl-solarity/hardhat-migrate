import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { AddressLike, getCreateAddress, Overrides, Signer, TransactionRequest, TransactionResponse } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { catchError } from "../utils";

import { Adapter } from "../types/adapter";
import { Args, ContractDeployParams } from "../types/deployer";
import { MigrateConfig } from "../types/migrations";

import { Reporter } from "../tools/reporter/Reporter";

export class Deployer {
  private _config: MigrateConfig;

  constructor(private _hre: HardhatRuntimeEnvironment, private _adapter: Adapter, private _reporter: Reporter) {
    this._config = _hre.config.migrate;
  }

  @catchError
  public async deploy(instance: any, args: Args, txOverrides: Overrides = {}): Promise<any> {
    const deployParams = this._adapter.getContractDeployParams(instance);

    const tx = await this._deploy(deployParams, args, txOverrides);

    await this._reportContractDeployTransactionSent(tx);

    await this._waitForDeployment(tx);

    return this._adapter.toInstance(getCreateAddress(tx), deployParams);
  }

  public async deploy2<T>(args: Args, txOverrides: Overrides = {}): Promise<any> {}

  @catchError
  protected async _deploy(
    deployParams: ContractDeployParams,
    args: Args,
    txOverrides: Overrides
  ): Promise<TransactionResponse> {
    const signer: Signer = await this._getSigner(txOverrides.from);

    const tx = await this._createDeployTransaction(deployParams, args, txOverrides);

    return await signer.sendTransaction(tx);
  }

  @catchError
  protected async _waitForDeployment(tx: TransactionResponse): Promise<void> {
    await tx.wait(this._config.confirmations);
  }

  protected async _reportContractDeployTransactionSent(tx: TransactionResponse): Promise<void> {
    Reporter.reportDeploy(tx);

    // TODO: save to storage
  }

  @catchError
  protected async _createDeployTransaction(
    contractParams: ContractDeployParams,
    args: Args,
    txOverrides: Overrides
  ): Promise<TransactionRequest> {
    const factory = new this._hre.ethers.ContractFactory(contractParams.abi, contractParams.bytecode);

    return await factory.getDeployTransaction(...args, txOverrides);
  }

  @catchError
  private async _getSigner(from?: null | AddressLike): Promise<HardhatEthersSigner> {
    if (!from) {
      return await this._hre.ethers.provider.getSigner();
    }

    const address = await this._hre.ethers.resolveAddress(from, this._hre.ethers.provider);

    return await this._hre.ethers.provider.getSigner(address);
  }
}

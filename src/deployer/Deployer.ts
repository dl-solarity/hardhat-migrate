import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { AddressLike, getCreateAddress, Overrides, Signer, TransactionRequest, TransactionResponse } from "ethers";

import { MigrateError } from "../errors";

import { Adapter } from "../types/adapter";
import { Args, ContractDeployParams } from "../types/deployer";

import { Reporter } from "../tools/reporter/Reporter";

export class Deployer {
  constructor(private _hre: HardhatRuntimeEnvironment, private _adapter: Adapter, private _reporter: Reporter) {}

  public async deploy(instance: any, args: Args, txOverrides: Overrides = {}): Promise<any> {
    try {
      const deployParams = this._adapter.getContractDeployParams(instance);

      const signer: Signer = await this._getSigner(txOverrides.from);

      const tx = await this._createDeployTransaction(deployParams, args, txOverrides);

      const sentTx = await signer.sendTransaction(tx);

      await this._reportContractDeploy(sentTx);

      await this._waitForDeployment(sentTx);

      return this._adapter.toInstance(getCreateAddress(sentTx), deployParams);
    } catch (e: any) {
      throw new MigrateError(e.message);
    }
  }

  public async deploy2<T>(args: Args, txOverrides: Overrides = {}): Promise<any> {}

  protected async _waitForDeployment(tx: TransactionResponse): Promise<void> {
    // TODO: is that OK?
    await tx.wait(this._hre.config.migrate.confirmations);
  }

  protected async _reportContractDeploy(tx: TransactionResponse): Promise<void> {
    Reporter.reportDeploy(tx);

    // TODO: save to storage
  }

  protected async _createDeployTransaction(
    contractParams: ContractDeployParams,
    args: Args,
    txOverrides: Overrides
  ): Promise<TransactionRequest> {
    const factory = new this._hre.ethers.ContractFactory(contractParams.abi, contractParams.bytecode);

    return factory.getDeployTransaction(...args, txOverrides);
  }

  private async _getSigner(from?: null | AddressLike): Promise<HardhatEthersSigner> {
    if (!from) {
      return await this._hre.ethers.provider.getSigner();
    }
    const address = await this._hre.ethers.resolveAddress(from, this._hre.ethers.provider);

    return this._hre.ethers.provider.getSigner(address);

    // TODO: find difference between this and above
    // return this._hre.ethers.getSigner(address);
  }
}

import { Signer } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { catchError, getSignerHelper, getChainId } from "../utils";

import { MigrateError } from "../errors";

import { Adapter } from "./adapters/Adapter";
import { PureAdapter } from "./adapters/PureAdapter";
import { EthersAdapter } from "./adapters/EthersAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";
import { PureEthersAdapter } from "./adapters/PureEthersAdapter";

import { OverridesAndLibs } from "../types/deployer";
import { Instance, TypedArgs } from "../types/adapter";
import { isContractFactory, isEthersFactory, isPureFactory, isTruffleFactory } from "../types/type-checks";

import { TransactionProcessor } from "../tools/storage/TransactionProcessor";

@catchError
export class Deployer {
  constructor(private _hre: HardhatRuntimeEnvironment) {}

  public async deploy<T, A = T, I = any>(
    contract: Instance<A, I> | (T extends Truffle.Contract<I> ? T : never),
    args: TypedArgs<A> = [] as TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ): Promise<I> {
    const adapter = this._resolveAdapter(this._hre, contract);

    const minimalContract = await adapter.fromInstance(contract);

    const contractAddress = await minimalContract.deploy(args, parameters);

    return adapter.toInstance(contract, contractAddress, parameters);
  }

  public setAsDeployed<A, I>(contract: Instance<A, I>, address: string): void {
    const adapter = this._resolveAdapter(this._hre, contract);

    const contractName = adapter.getContractName(contract);

    TransactionProcessor.saveDeploymentTransactionWithContractName(contractName, address);
  }

  public async deployed<A, I>(contract: Instance<A, I>): Promise<I> {
    const adapter = this._resolveAdapter(this._hre, contract);

    const contractName = adapter.getContractName(contract);
    const contractAddress = await TransactionProcessor.tryRestoreContractAddressByName(contractName, this._hre);

    return adapter.toInstance(contract, contractAddress, {});
  }

  public async getSigner(from?: string): Promise<Signer> {
    return getSignerHelper(this._hre, from);
  }

  public async getChainId(): Promise<bigint> {
    return getChainId(this._hre);
  }

  private _resolveAdapter<A, I>(hre: HardhatRuntimeEnvironment, contract: Instance<A, I>): Adapter {
    if (isEthersFactory(contract)) {
      return new EthersAdapter(hre);
    }

    if (isTruffleFactory(contract)) {
      return new TruffleAdapter(hre);
    }

    if (isPureFactory(contract)) {
      return new PureAdapter(hre);
    }

    if (isContractFactory(contract)) {
      return new PureEthersAdapter(hre);
    }

    throw new MigrateError("Unknown Contract Factory Type");
  }
}

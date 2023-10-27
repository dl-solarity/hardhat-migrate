import { Signer } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { catchError, getChainId, getSignerHelper, isDeployedContractAddress } from "../utils";

import { MigrateError } from "../errors";

import { Adapter } from "./adapters/Adapter";
import { EthersAdapter } from "./adapters/EthersAdapter";
import { PureAdapter } from "./adapters/PureAdapter";
import { PureEthersAdapter } from "./adapters/PureEthersAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

import { Instance, TypedArgs } from "../types/adapter";
import { OverridesAndLibs } from "../types/deployer";
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
    const adapter = this._resolveAdapter(contract);

    const minimalContract = await adapter.fromInstance(contract);

    const contractAddress = await minimalContract.deploy(args, parameters);

    return adapter.toInstance(contract, contractAddress, parameters);
  }

  public setAsDeployed<T, A = T, I = any>(
    contract: Instance<A, I> | (T extends Truffle.Contract<I> ? T : never),
    address: string,
  ): void {
    const adapter = this._resolveAdapter(contract);

    const contractName = adapter.getContractName(contract);

    TransactionProcessor.saveDeploymentTransactionWithContractName(contractName, address);
  }

  public async deployed<T, A = T, I = any>(
    contract: Instance<A, I> | (T extends Truffle.Contract<I> ? T : never),
    contractAddress?: string,
  ): Promise<I> {
    const adapter = this._resolveAdapter(contract);

    if (contractAddress) {
      if (!(await isDeployedContractAddress(this._hre, contractAddress))) {
        throw new MigrateError(`Contract with address '${contractAddress}' is not deployed`);
      }
    } else {
      const contractName = adapter.getContractName(contract);
      contractAddress = await TransactionProcessor.tryRestoreContractAddressByName(contractName, this._hre);
    }

    return adapter.toInstance(contract, contractAddress, {});
  }

  public async getSigner(from?: string): Promise<Signer> {
    return getSignerHelper(this._hre, from);
  }

  public async getChainId(): Promise<bigint> {
    return getChainId(this._hre);
  }

  private _resolveAdapter<A, I>(contract: Instance<A, I>): Adapter {
    if (isEthersFactory(contract)) {
      return new EthersAdapter(this._hre);
    }

    if (isTruffleFactory(contract)) {
      return new TruffleAdapter(this._hre);
    }

    if (isPureFactory(contract)) {
      return new PureAdapter(this._hre);
    }

    if (isContractFactory(contract)) {
      return new PureEthersAdapter(this._hre);
    }

    throw new MigrateError("Unknown Contract Factory Type");
  }
}

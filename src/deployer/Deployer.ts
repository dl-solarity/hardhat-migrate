/* eslint-disable @typescript-eslint/no-explicit-any */
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployerCore } from "./DeployerCore";

import { Adapter } from "./adapters/Adapter";
import { EthersAdapter } from "./adapters/EthersAdapter";
import { PureAdapter } from "./adapters/PureAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

import { catchError, getSignerHelper } from "../utils";

import { MigrateError } from "../errors";

import { EthersFactory, Instance, PureFactory, TruffleFactory, TypedArgs } from "../types/adapter";
import { OverridesAndLibs } from "../types/deployer";

@catchError
export class Deployer {
  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _core = new DeployerCore(_hre),
  ) {}

  public async deploy<A, I>(
    contract: Instance<A, I>,
    args: TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ): Promise<I> {
    const adapter = this._resolveAdapter(contract);

    const deploymentParams = await adapter.getContractDeployParams(contract);

    const contractAddress = await this._core.deploy(deploymentParams, args, parameters);

    return adapter.toInstance(contract, contractAddress, await getSignerHelper(this._hre, parameters.from));
  }

  public async link<A, I>(library: any, instance: Instance<A, I>): Promise<void> {
    await this._resolveAdapter(instance).link(library, instance);
  }

  private _resolveAdapter<A, I>(contract: Instance<A, I>): Adapter {
    if (this.isEthersFactory(contract)) {
      return new EthersAdapter(this._hre);
    }

    if (this.isTruffleFactory(contract)) {
      return new TruffleAdapter(this._hre);
    }

    if (this.isPureFactory(contract)) {
      return new PureAdapter(this._hre);
    }

    throw new MigrateError("Unknown Contract Factory Type");
  }

  private isEthersFactory<A, I>(instance: any): instance is EthersFactory<A, I> {
    return instance.createInterface !== undefined;
  }

  private isTruffleFactory<I>(instance: any): instance is TruffleFactory<I> {
    return instance instanceof Function && instance.prototype.constructor !== undefined;
  }

  private isPureFactory<I>(instance: any): instance is PureFactory<I> {
    return instance.contractName !== undefined;
  }
}

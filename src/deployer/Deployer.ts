import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployerCore } from "./DeployerCore";

import { PureAdapter } from "./adapters/PureAddapter";
import { EthersAdapter } from "./adapters/EthersAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

import { catchError, getSignerHelper } from "../utils";

import { MigrateError } from "../errors";

import { Args, OverridesAndLibs } from "../types/deployer";
import { Adapter, EthersFactory, Instance, PureFactory, TruffleFactory } from "../types/adapter";

@catchError
export class Deployer {
  private _adapter: Adapter = {} as Adapter;

  // TODO: delete private _deployerType: PluginName from config
  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _core = new DeployerCore(_hre),
  ) {}

  public async deploy<A, I>(contract: Instance<A, I>, args: Args, parameters: OverridesAndLibs = {}): Promise<I> {
    this._resolveAdapter(contract);

    const deploymentParams = await this._adapter.getContractDeployParams(contract);

    const contractAddress = await this._core.deploy(deploymentParams, args, parameters);

    // TODO: Move to the core. Should not be handled here.
    // if (tx) {
    //   this._cacheContractAddress(deploymentParams, tx, contractAddress);
    // }

    return this._adapter.toInstance(contract, contractAddress, await getSignerHelper(this._hre, parameters.from));
  }

  public link<A, I>(library: any, instance: Instance<A, I>): void {
    this._resolveAdapter(instance);

    this._adapter.link(library, instance);
  }

  private _resolveAdapter<A, I>(contract: Instance<A, I>): void {
    if (contract instanceof EthersFactory) {
      this._adapter = new EthersAdapter(this._hre);
    }

    if (contract instanceof TruffleFactory) {
      this._adapter = new TruffleAdapter(this._hre);
    }

    if (contract instanceof PureFactory) {
      this._adapter = new PureAdapter(this._hre);
    }

    // TODO: research how to extend this.

    throw new MigrateError("Unknown Contract Factory Type");
  }
}

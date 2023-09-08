import { DeployerCore } from "./DeployerCore";

import { EthersAdapter } from "./adapters/EthersAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

import { catchError } from "../utils";

import { PluginName } from "../types/migrations";
import { Adapter, Instance } from "../types/adapter";

export class Deployer {
  constructor(
    private _hre: any,
    private _deployerType: PluginName,
    private _adapter: Adapter = new EthersAdapter(_hre),
    private _core = new DeployerCore(_hre),
  ) {
    this._setAdapter();
  }

  @catchError
  public async deploy<A, I>(contract: Instance<A, I>, args: any[], txOverrides: any = {}): Promise<I> {
    const deploymentArgs = this._adapter.getContractDeployParams(contract);

    const contractAddress = await this._core.deploy(deploymentArgs, args, txOverrides);

    return this._adapter.toInstance(contract, contractAddress);
  }

  @catchError
  public link(library: any, instance: any): void {
    this._adapter.linkLibrary(library, instance);
  }

  @catchError
  private _setAdapter() {
    switch (this._deployerType) {
      case PluginName.ETHERS:
        this._adapter = new EthersAdapter(this._hre);
        break;
      case PluginName.TRUFFLE:
        this._adapter = new TruffleAdapter(this._hre);
        break;
      default:
        throw new Error(`Invalid deployer type: ${this._deployerType}`);
    }
  }
}

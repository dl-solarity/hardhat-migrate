import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployerCore } from "./DeployerCore";

import { Adapter } from "./adapters/Adapter";
import { PureAdapter } from "./adapters/PureAdapter";
import { EthersAdapter } from "./adapters/EthersAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

import { catchError, getSignerHelper } from "../utils";

import { MigrateError } from "../errors";

import { TypedArgs, Instance } from "../types/adapter";
import { OverridesAndLibs } from "../types/deployer";
import { isEthersFactory, isPureFactory, isTruffleFactory } from "../types/type-guards";

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
    if (isEthersFactory(contract)) {
      return new EthersAdapter(this._hre);
    }

    if (isTruffleFactory(contract)) {
      return new TruffleAdapter(this._hre);
    }

    if (isPureFactory(contract)) {
      return new PureAdapter(this._hre);
    }

    // TODO: research how to extend this.

    throw new MigrateError("Unknown Contract Factory Type");
  }
}

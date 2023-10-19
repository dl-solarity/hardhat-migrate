import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployerCore } from "./DeployerCore";

import { catchError, getSignerHelper, isEthersFactory, isPureFactory, isTruffleFactory } from "../utils";

import { MigrateError } from "../errors";

import { Adapter } from "./adapters/Adapter";
import { PureAdapter } from "./adapters/PureAdapter";
import { EthersAdapter } from "./adapters/EthersAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

import { OverridesAndLibs } from "../types/deployer";
import { Instance, TypedArgs } from "../types/adapter";

import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";

@catchError
export class Deployer {
  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _core = new DeployerCore(_hre),
  ) {}

  public async deploy<T, A = T, I = any>(
    contract: Instance<A, I> | (T extends Truffle.Contract<I> ? T : never),
    args: TypedArgs<A>,
    parameters: OverridesAndLibs = {},
  ): Promise<I> {
    const adapter = this.resolveAdapter(this._hre, contract);

    const deploymentParams = await adapter.getContractDeployParams(contract);

    const contractAddress = await this._core.deploy(deploymentParams, args, parameters);

    return adapter.toInstance(contract, contractAddress, await getSignerHelper(this._hre, parameters.from));
  }

  public async deployed<A, I>(contract: Instance<A, I>): Promise<I> {
    const adapter = this.resolveAdapter(this._hre, contract);

    const contractName = ArtifactProcessor.getContractName((await adapter.getContractDeployParams(contract)).bytecode);

    const contractAddress = TransactionProcessor.tryRestoreSavedContractAddress(contractName);

    return adapter.toInstance(contract, contractAddress, await getSignerHelper(this._hre));
  }

  public async link<A, I>(library: any, instance: Instance<A, I>): Promise<void> {
    await this.resolveAdapter(this._hre, instance).link(library, instance);
  }

  public resolveAdapter<A, I>(hre: HardhatRuntimeEnvironment, contract: Instance<A, I>): Adapter {
    if (isEthersFactory(contract)) {
      return new EthersAdapter(hre);
    }

    if (isTruffleFactory(contract)) {
      return new TruffleAdapter(hre);
    }

    if (isPureFactory(contract)) {
      return new PureAdapter(hre);
    }

    throw new MigrateError("Unknown Contract Factory Type");
  }
}

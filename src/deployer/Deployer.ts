import { HardhatRuntimeEnvironment } from "hardhat/types";

import { DeployerCore } from "./DeployerCore";

import { catchError, getSignerHelper, isEthersFactory, isPureFactory, isTruffleFactory } from "../utils";

import { MigrateError } from "../errors";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../tools/storage/TransactionProcessor";
import { Instance, ProxyTypedArgs, TypedArgs } from "../types/adapter";
import { Args, OverridesAndLibs } from "../types/deployer";
import { Adapter } from "./adapters/Adapter";
import { EthersAdapter } from "./adapters/EthersAdapter";
import { PureAdapter } from "./adapters/PureAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

@catchError
export class Deployer {
  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _core = new DeployerCore(_hre),
  ) {}

  public async deploy<A, I>(
    contract: Instance<A, I>,
    args: TypedArgs<A> = [] as any,
    parameters: OverridesAndLibs = {},
  ): Promise<I> {
    const adapter = resolveAdapter(this._hre, contract);

    const deploymentParams = await adapter.getContractDeployParams(contract);

    const contractAddress = await this._core.deploy(deploymentParams, args, parameters);

    return adapter.toInstance(contract, contractAddress, await getSignerHelper(this._hre, parameters.from));
  }

  public async deployProxy<A, I, B, J>(
    contract: Instance<A, I>,
    initArgs: Args = [] as any,
    parameters: OverridesAndLibs = {},
    opts: {
      kind: Instance<B, J>;
      args: ProxyTypedArgs<B>;
      initializer?: string | false;
      txOverrides?: OverridesAndLibs;
      constructorArgs?: TypedArgs<A>;
    },
  ): Promise<I> {
    const adapter = resolveAdapter(this._hre, contract);

    const contractImplementationAddress = await this._core.deploy(
      await adapter.getContractDeployParams(contract),
      opts.constructorArgs || [],
      parameters,
    );

    let proxyAddress: string = "";
    if (this._isUUPSProxy(contract)) {
      const proxyArgs = [contractImplementationAddress, ...opts.args];

      proxyAddress = await this._core.deploy(await adapter.getContractDeployParams(opts.kind), proxyArgs, {
        misc: contractImplementationAddress,
        ...(opts.txOverrides || {}),
      });
    }

    const contractInstance = adapter.toInstance(
      contract,
      proxyAddress,
      await getSignerHelper(this._hre, parameters.from),
    );

    if (opts.initializer) {
      await (contractInstance as any)[opts.initializer](...initArgs);
    }

    TransactionProcessor.saveDeploymentByName(
      ArtifactProcessor.getContractName((await adapter.getContractDeployParams(contract)).bytecode),
      proxyAddress,
    );

    return contractInstance;
  }

  public async deployed<A, I>(contract: Instance<A, I>): Promise<I> {
    const adapter = resolveAdapter(this._hre, contract);

    const contractName = ArtifactProcessor.getContractName((await adapter.getContractDeployParams(contract)).bytecode);

    const contractAddress = TransactionProcessor.tryRestoreSavedContractAddress(contractName);

    return adapter.toInstance(contract, contractAddress, await getSignerHelper(this._hre));
  }

  public async link<A, I>(library: any, instance: Instance<A, I>): Promise<void> {
    await resolveAdapter(this._hre, instance).link(library, instance);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _isUUPSProxy(instance: any): boolean {
    return true;
  }
}

export function resolveAdapter<A, I>(hre: HardhatRuntimeEnvironment, contract: Instance<A, I>): Adapter {
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

import { DeployerCore } from "./DeployerCore";

import { EthersAdapter } from "./adapters/EthersAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

import { catchError } from "../utils";

import { ContractDeployTransaction } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { MigrateError } from "../errors";
import { TransactionStorage } from "../tools/storage/TransactionStorage";
import { Adapter, Instance } from "../types/adapter";
import { Args, ContractDeployParams, OverridesAndLibs } from "../types/deployer";
import { PluginName } from "../types/migrations";

@catchError
export class Deployer {
  private _adapter: Adapter;

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _deployerType: PluginName,
    private _core = new DeployerCore(_hre),
  ) {
    switch (this._deployerType) {
      case PluginName.ETHERS:
        this._adapter = new EthersAdapter(this._hre);
        break;
      case PluginName.TRUFFLE:
        this._adapter = new TruffleAdapter(this._hre);
        break;
      default:
        throw new MigrateError(`Invalid deployer type: ${this._deployerType}`);
    }
  }

  public async deploy<A, I>(contract: Instance<A, I>, args: Args, parameters: OverridesAndLibs = {}): Promise<I> {
    const deploymentParams = await this._adapter.getContractDeployParams(contract, parameters.libraries);

    const [contractAddress, tx] = await this._core.deploy(deploymentParams, args, parameters);
    if (tx) {
      this._cacheContractAddress(deploymentParams, tx, contractAddress);
    }

    return this._adapter.toInstance(contract, contractAddress, await this._core.getSigner(parameters.from));
  }

  /**
   * @deprecated Use `deploy` instead.
   */
  public link(library: any, instance: any): void {
    this._adapter.linkLibrary(library, instance);
  }

  private _cacheContractAddress(
    deploymentParams: ContractDeployParams,
    tx: ContractDeployTransaction,
    address: string,
  ) {
    const transactionStorage = TransactionStorage.getInstance();
    transactionStorage.saveDeploymentTransaction(tx, address);

    const contractName = deploymentParams.contractName;
    if (contractName) {
      transactionStorage.saveDeploymentTransactionByName(contractName, address);
    }
  }
}

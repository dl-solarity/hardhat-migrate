import { DeployerCore } from "./DeployerCore";

import { EthersAdapter } from "./adapters/EthersAdapter";
import { TruffleAdapter } from "./adapters/TruffleAdapter";

import { catchError, contractNameFromSourceCode } from "../utils";

import { Overrides } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { TransactionStorage } from "../tools/storage/TransactionStorage";
import { Adapter, Instance } from "../types/adapter";
import { Args, ContractDeployParams } from "../types/deployer";
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
        throw new Error(`Invalid deployer type: ${this._deployerType}`);
    }
  }

  public async deploy<A, I>(contract: Instance<A, I>, args: Args, txOverrides: Overrides = {}): Promise<I> {
    const deploymentParams = this._adapter.getContractDeployParams(contract);

    const contractAddress = await this._core.deploy(deploymentParams, args, txOverrides);

    this._cacheContractAddress(contract.toString(), deploymentParams, args, txOverrides, contractAddress);

    return this._adapter.toInstance(contract, contractAddress, await this._core.getSigner(txOverrides.from));
  }

  // eslint-disable-next-line
  public link(library: any, instance: any): void {
    this._adapter.linkLibrary(library, instance);
  }

  private _cacheContractAddress(
    contractSourceCode: string,
    deployParams: ContractDeployParams,
    args: Args,
    txOverrides: Overrides,
    address: string,
  ) {
    const transactionStorage = TransactionStorage.getInstance();

    transactionStorage.saveDeploymentTransaction(deployParams, args, txOverrides, address);

    const contractName = contractNameFromSourceCode(contractSourceCode);
    if (contractName) {
      transactionStorage.saveDeploymentTransactionByName(contractName, address);
    }
  }
}

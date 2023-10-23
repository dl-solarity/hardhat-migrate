import { BaseContract, Interface } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Adapter } from "./Adapter";
import { EthersInjectHelper } from "./EthersInjectHelper";

import { MinimalContract } from "../MinimalContract";

import { bytecodeToString, catchError, getSignerHelper } from "../../utils";

import { PureFactory } from "../../types/adapter";
import { OverridesAndLibs } from "../../types/deployer";

@catchError
export class PureAdapter extends Adapter {
  private _injectHelper: EthersInjectHelper;

  constructor(protected _hre: HardhatRuntimeEnvironment) {
    super(_hre);
    this._injectHelper = new EthersInjectHelper(_hre);
  }

  public async fromInstance(instance: PureFactory): Promise<MinimalContract> {
    return new MinimalContract(
      this._hre,
      this.getRawBytecode(instance),
      this.getInterface(instance),
      this.getContractName(instance),
    );
  }

  public async toInstance<I>(instance: PureFactory, address: string, parameters: OverridesAndLibs): Promise<I> {
    const signer = await getSignerHelper(this._hre, parameters.from);

    const contract = new BaseContract(address, this.getInterface(instance), signer);

    return this._injectHelper.insertHandlers(contract, this.getContractName(instance), parameters) as unknown as I;
  }

  public getInterface(instance: PureFactory): Interface {
    return Interface.from(instance.abi);
  }

  public getRawBytecode(instance: PureFactory): string {
    return bytecodeToString(instance.bytecode);
  }

  public getContractName(instance: PureFactory): string {
    return instance.contractName;
  }
}

import { BaseContract, ContractFactory, Interface } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Adapter } from "./Adapter";
import { EthersInjectHelper } from "./EthersInjectHelper";

import { MinimalContract } from "../MinimalContract";

import { catchError, getSignerHelper } from "../../utils";

import { OverridesAndLibs } from "../../types/deployer";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";

@catchError
export class PureEthersAdapter extends Adapter {
  private _injectHelper: EthersInjectHelper;

  constructor(protected _hre: HardhatRuntimeEnvironment) {
    super(_hre);
    this._injectHelper = new EthersInjectHelper(_hre);
  }

  public async fromInstance(instance: ContractFactory): Promise<MinimalContract> {
    return new MinimalContract(
      this._hre,
      this.getRawBytecode(instance),
      this.getInterface(instance),
      this.getContractName(instance),
    );
  }

  public async toInstance<I>(instance: ContractFactory, address: string, parameters: OverridesAndLibs): Promise<I> {
    const signer = await getSignerHelper(this._hre, parameters.from);

    const contract = new BaseContract(address, this.getInterface(instance), signer);

    return this._injectHelper.insertHandlers(contract, this.getContractName(instance), parameters) as unknown as I;
  }

  public getInterface(instance: ContractFactory): Interface {
    return instance.interface;
  }

  public getRawBytecode(instance: ContractFactory): string {
    return instance.bytecode;
  }

  public getContractName(instance: ContractFactory): string {
    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      return "Unknown Contract";
    }
  }
}

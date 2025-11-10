import { Interface } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { MinimalContract } from "../MinimalContract.js";

import { CatchClassError } from "../../utils/index.js";

import { BaseInstance, Instance } from "../../../types/adapter.js";
import { OverridesAndLibs, OverridesAndName } from "../../../types/deployer.js";

@CatchClassError
export abstract class Adapter {
  public constructor(protected _hre: HardhatRuntimeEnvironment) {}

  public abstract fromInstance<A, I>(instance: Instance<A, I>, parameters: OverridesAndName): Promise<MinimalContract>;

  public abstract toInstance<A, I>(
    instance: BaseInstance<A, I>,
    address: string,
    parameters: OverridesAndLibs,
  ): Promise<I>;

  public abstract getInterface<A, I>(instance: BaseInstance<A, I>): Interface;

  public abstract getRawBytecode<A, I>(instance: Instance<A, I>): string;

  public abstract getContractName<A, I>(instance: BaseInstance<A, I>, parameters: OverridesAndName): string;
}

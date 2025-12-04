import { Interface } from "ethers";

import { MinimalContract } from "../MinimalContract.js";

import { CatchClassError } from "../../utils/index.js";

import type { BaseInstance, Instance } from "../../../types/adapter.js";
import type { OverridesAndLibs, OverridesAndName } from "../../../types/deployer.js";

@CatchClassError
export abstract class Adapter {
  public constructor() {}

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

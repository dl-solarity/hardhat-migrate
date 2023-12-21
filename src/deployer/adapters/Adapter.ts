import { Interface } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MinimalContract } from "../MinimalContract";

import { catchError } from "../../utils";

import { Instance } from "../../types/adapter";
import { OverridesAndLibs, OverridesAndName } from "../../types/deployer";

@catchError
export abstract class Adapter {
  public constructor(protected _hre: HardhatRuntimeEnvironment) {}

  public abstract fromInstance<A, I>(instance: Instance<A, I>, parameters: OverridesAndName): Promise<MinimalContract>;

  public abstract toInstance<A, I>(instance: Instance<A, I>, address: string, parameters: OverridesAndLibs): Promise<I>;

  public abstract getInterface<A, I>(instance: Instance<A, I>): Interface;

  public abstract getRawAbi<A, I>(instance: Instance<A, I>): string;

  public abstract getRawBytecode<A, I>(instance: Instance<A, I>): string;

  public abstract getContractName<A, I>(instance: Instance<A, I>, parameters: OverridesAndName): string;
}

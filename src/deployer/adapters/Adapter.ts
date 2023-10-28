import { Interface } from "ethers";

import { MinimalContract } from "../MinimalContract";

import { catchError } from "../../utils";

import { Instance } from "../../types/adapter";
import { MigrateConfig } from "../../types/migrations";
import { OverridesAndLibs, OverridesAndMisc } from "../../types/deployer";

@catchError
export abstract class Adapter {
  public constructor(protected _config: MigrateConfig) {}

  public abstract fromInstance<A, I>(instance: Instance<A, I>, parameters: OverridesAndMisc): Promise<MinimalContract>;

  public abstract toInstance<A, I>(instance: Instance<A, I>, address: string, parameters: OverridesAndLibs): Promise<I>;

  public abstract getInterface<A, I>(instance: Instance<A, I>): Interface;

  public abstract getRawBytecode<A, I>(instance: Instance<A, I>): string;

  public abstract getContractName<A, I>(instance: Instance<A, I>, parameters: OverridesAndMisc): string;
}

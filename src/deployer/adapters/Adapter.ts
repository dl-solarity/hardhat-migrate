import { Interface } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MinimalContract } from "../MinimalContract";

import { catchError } from "../../utils";

import { Instance } from "../../types/adapter";
import { MigrateConfig } from "../../types/migrations";
import { OverridesAndLibs } from "../../types/deployer";

@catchError
export abstract class Adapter {
  protected _config: MigrateConfig;

  protected constructor(protected _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
  }

  public abstract fromInstance<A, I>(instance: Instance<A, I>): Promise<MinimalContract>;

  public abstract toInstance<A, I>(instance: Instance<A, I>, address: string, parameters: OverridesAndLibs): Promise<I>;

  public abstract getInterface<A, I>(instance: Instance<A, I>): Interface;

  public abstract getRawBytecode<A, I>(instance: Instance<A, I>): string;

  public abstract getContractName<A, I>(instance: Instance<A, I>): string;
}

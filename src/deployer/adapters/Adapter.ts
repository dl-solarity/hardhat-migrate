import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MigrateError } from "../../errors";

import { catchError } from "../../utils";

import { Instance } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

@catchError
export abstract class Adapter {
  constructor(protected _hre: HardhatRuntimeEnvironment) {}

  public async getContractDeployParams(instance: any): Promise<ContractDeployParams> {
    return {
      abi: this._getABI(instance),
      bytecode: this._getRawBytecode(instance),
    };
  }

  public async link(_instance: any, _library: any): Promise<void> {
    throw new MigrateError("Linking is not supported with provided Factory.");
  }

  public abstract toInstance<A, I>(instance: Instance<A, I>, address: string, signer: any): I;

  protected abstract _getABI(instance: any): Abi;

  protected abstract _getRawBytecode(instance: any): string;
}

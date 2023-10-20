import { Interface, FunctionFragment } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { catchError } from "../../utils";

import { Instance } from "../../types/adapter";
import { MigrateConfig } from "../../types/migrations";
import { ContractDeployParams } from "../../types/deployer";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";

@catchError
export abstract class Adapter {
  protected _config: MigrateConfig;

  constructor(protected _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
  }

  public async getContractDeployParams(instance: any): Promise<ContractDeployParams> {
    return {
      abi: this._getInterface(instance),
      bytecode: this._getRawBytecode(instance),
    };
  }

  protected tryGetContractName(instance: any): string {
    if (instance.contractName !== undefined) {
      return instance.contractName;
    }

    return ArtifactProcessor.tryGetContractName(this._getRawBytecode(instance)).split(":")[1];
  }

  public abstract toInstance<A, I>(instance: Instance<A, I>, address: string, signer: any): Promise<I>;

  protected abstract _getInterface(instance: any): Interface;

  protected abstract _getRawBytecode(instance: any): string;

  protected _getContractMethods<A, I>(instance: Instance<A, I>): FunctionFragment[] {
    const fragments = this._getInterface(instance);

    const methods: FunctionFragment[] = [];
    fragments.forEachFunction((fragment) => {
      if (!fragment.constant) {
        methods.push(fragment);
      }
    });

    return methods;
  }
}

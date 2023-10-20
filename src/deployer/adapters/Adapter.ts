import { Interface, FunctionFragment } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { catchError } from "../../utils";

import { MigrateError } from "../../errors";

import { Instance } from "../../types/adapter";
import { MigrateConfig } from "../../types/migrations";
import { ContractDeployParams } from "../../types/deployer";

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async link(_instance: any, _library: any): Promise<void> {
    throw new MigrateError("Linking is not supported with provided Factory.");
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

  protected _getMethodString(
    contractName: string,
    methodName: string,
    methodFragment: FunctionFragment,
    ...args: any[]
  ): string {
    let argsString = "";

    for (let i = 0; i < args.length; i++) {
      argsString += `${methodFragment.inputs[i].name}:${args[i]}${i === args.length - 1 ? "" : ", "}`;
    }

    return `${contractName}.${methodName}(${argsString})`;
  }
}

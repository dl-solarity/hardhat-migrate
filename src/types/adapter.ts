import { ContractRunner } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Abi, Bytecode, ContractDeployParams } from "./deployer";

import { MigrateError } from "../errors";

import { catchError } from "../utils";

// TODO: rewrite through declare modules

export abstract class EthersFactory<A, I> {
  abstract bytecode: any;
  abstract abi: Abi;

  abstract createInterface(): A;

  abstract connect(address: string, runner?: ContractRunner | null): I;
}

export abstract class TruffleFactory<I> {
  abstract contractName: string;

  abstract new(_name: string, meta?: any): Promise<I>;
}

export abstract class PureFactory<I> {
  abstract abi: Abi;
  abstract bytecode: Bytecode;
  abstract contractName: I;
}

export type Instance<A, I> = TruffleFactory<I> | EthersFactory<A, I> | PureFactory<I>;

@catchError
export abstract class Adapter {
  constructor(protected _hre: HardhatRuntimeEnvironment) {}

  public async getContractDeployParams(instance: any): Promise<ContractDeployParams> {
    return {
      abi: this._getABI(instance),
      bytecode: this._getRawBytecode(instance),
    };
  }

  public link(instance: any, library: any): void {
    throw new MigrateError("Linking is not supported with provided Factory.");
  }

  public abstract toInstance<A, I>(instance: Instance<A, I>, address: string, signer: ContractRunner | null): I;

  protected abstract _getABI(instance: any): Abi;

  protected abstract _getRawBytecode(instance: any): Bytecode;
}

interface Link {
  sourceName: string;
  libraryName: string;
  address: string;
}

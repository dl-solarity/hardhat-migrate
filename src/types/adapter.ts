import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ContractFactory, ContractRunner } from "ethers";
import { Abi, Bytecode, ContractDeployParams } from "./deployer";

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

export type Instance<A, I> = TruffleFactory<I> | EthersFactory<A, I> | ContractFactory<A[], I>;

export abstract class Adapter {
  constructor(protected _hre: HardhatRuntimeEnvironment) {}

  public abstract linkLibrary(instance: any, library: any): void;

  public getContractDeployParams(instance: any): ContractDeployParams {
    return {
      abi: this._getABI(instance),
      bytecode: this._getBytecode(instance),
    };
  }

  public abstract toInstance<A, I>(instance: Instance<A, I>, address: string, signer: ContractRunner | null): I;

  protected abstract _getABI(instance: any): Abi;

  protected abstract _getBytecode(instance: any): Bytecode;

  // protected abstract _validateBytecode(bytecode: Bytecode): boolean;
}

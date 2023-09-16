import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ContractFactory, ContractRunner } from "ethers";
import { MigrateError } from "../errors";
import { ArtifactExtended } from "../parser/ArtifactsParser";
import { TemporaryStorage } from "../tools/storage/TemporaryStorage";
import { Abi, Bytecode, ContractDeployParams } from "./deployer";

// TODO: rewrite through declare modules

export interface EthersFactory<A, I> {
  bytecode: any;
  abi: Abi;

  createInterface(): A;

  connect(address: string, runner?: ContractRunner | null): I;
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
      contractName: this.getContractName(instance),
    };
  }

  public getContractName(instance: any): string {
    const artifact = TemporaryStorage.getInstance().get(this._getRawBytecode(instance)) as ArtifactExtended;

    if (!artifact) {
      throw new MigrateError(`Contract name not found for instance: ${instance}`);
      // TODO: change to warning
    }

    return artifact.contractName;
  }

  public abstract toInstance<A, I>(instance: Instance<A, I>, address: string, signer: ContractRunner | null): I;

  protected abstract _getABI(instance: any): Abi;

  protected abstract _getBytecode(instance: any): Bytecode;

  protected abstract _getRawBytecode(instance: any): Bytecode;

  protected _validateBytecode(bytecode: Bytecode): boolean {
    const bytecodeString = bytecode.toString();

    return bytecodeString.indexOf("__") === -1;
  }
}

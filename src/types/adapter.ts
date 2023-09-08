import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

import { Abi, ContractDeployParams } from "./deployer";
import { ContractRunner } from "ethers";

// TODO: rewrite through declare modules

export abstract class EthersFactory<A, I> {
  abstract bytecode: any;
  abstract abi: any;

  abstract createInterface(): A;

  abstract connect(address: string, runner?: ContractRunner | null): I;
}

export abstract class TruffleFactory<I> {
  abstract contractName: string;

  abstract new(_name: string, meta?: any): Promise<I>;
}

export type Instance<A, I> = TruffleFactory<I> | EthersFactory<A, I>;

export abstract class Adapter {
  protected _artifacts: Map<string, Artifact> = new Map();

  constructor(protected _hre: HardhatRuntimeEnvironment) {}

  public abstract linkLibrary(instance: any, library: any): void;

  public getContractDeployParams(instance: any): ContractDeployParams {
    return {
      abi: this._getABI(instance),
      bytecode: this._getBytecode(instance),
    };
  }

  public abstract toInstance<A, I>(instance: Instance<A, I>, address: string, signer?: ContractRunner | null): I;

  protected getArtifact(contractName: string): Artifact {
    if (this._artifacts.has(contractName)) {
      return this._artifacts.get(contractName)!;
    }

    const artifact = this._hre.artifacts.readArtifactSync(contractName);

    this._artifacts.set(contractName, artifact);

    return artifact;
  }

  protected abstract _getABI(instance: any): Abi;

  protected abstract _getBytecode(instance: any): string;

  // protected abstract _validateBytecode(bytecode: string): boolean;
}

import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";

import { Abi, ContractDeployParams } from "./deployer";

export abstract class Adapter {
  protected _artifacts: Map<string, Artifact> = new Map();

  constructor(protected _hre: HardhatRuntimeEnvironment) {}

  public getContractDeployParams(instance: any): ContractDeployParams {
    return {
      abi: this._getABI(instance),
      bytecode: this._getBytecode(instance),
    };
  }

  public abstract toInstance(address: string, params: ContractDeployParams): any;

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

  protected _linkLib(): void;

  private _validateBytecode(bytecode: string): boolean;
}

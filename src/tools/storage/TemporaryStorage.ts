import { MigrateError } from "../../errors";
import { ArtifactExtended } from "../../types/artifacts-parser";
import { Bytecode } from "../../types/deployer";
import { bytecodeHash, bytecodeToString } from "../../utils";

export class TemporaryStorage {
  private static _instance: TemporaryStorage;

  private _storage: Record<any, any> = {};

  private constructor() {}

  public static getInstance(): TemporaryStorage {
    if (!TemporaryStorage._instance) {
      TemporaryStorage._instance = new TemporaryStorage();
    }

    return TemporaryStorage._instance;
  }

  public getExtendedArtifact(bytecode: string): ArtifactExtended {
    const artifact = this._storage[bytecodeHash(bytecode)];
    if (!artifact) {
      throw new MigrateError(`Artifact not found`);
    }

    return artifact;
  }

  public getContractName(bytecode: Bytecode): string {
    const artifact = this._get(bytecodeHash(bytecodeToString(bytecode))) as ArtifactExtended;
    if (!artifact) {
      throw new MigrateError(`Contract name not found`);
    }

    return `${artifact.sourceName}:${artifact.contractName}`;
  }

  public save(key: any, value: any): void {
    this._storage[key] = value;
  }

  private _get(key: any): any {
    return this._storage[key];
  }
}

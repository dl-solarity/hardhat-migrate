import { existsSync, readFileSync, writeFileSync, rmSync } from "fs";

import { lazyObject } from "hardhat/plugins";

import { MigrateError } from "../../errors";

import { catchError, resolvePathToFile, toJSON } from "../../utils";

import { StorageNamespaces } from "../../types/tools";

@catchError
class BaseStorage {
  private readonly _fileName = ".storage.json";

  protected _state: Record<string, any> = lazyObject(() => this._readFullStateFromFile());

  public clearAll(): void {
    for (const namespace of Object.values(StorageNamespaces)) {
      this._state[namespace] = {};
    }

    this._saveStateToFile();
  }

  public clean(): void {
    if (this._stateExistsInFile()) {
      rmSync(this._filePath(), { force: true });
    }
  }

  protected _saveStateToFile() {
    writeFileSync(this._filePath(), toJSON(this._state), {
      flag: "w",
      encoding: "utf8",
    });
  }

  private _stateExistsInFile(): boolean {
    return existsSync(this._filePath());
  }

  private _readFullStateFromFile(): Record<string, Record<string, any>> {
    if (!this._stateExistsInFile()) {
      return {};
    }

    const fileContent = readFileSync(this._filePath(), {
      encoding: "utf8",
    });

    return JSON.parse(fileContent);
  }

  private _filePath(): string {
    return resolvePathToFile("cache", this._fileName);
  }
}

@catchError
export class MigrateStorage extends BaseStorage {
  constructor(private _namespace: StorageNamespaces = StorageNamespaces.Storage) {
    super();

    if (!this._state[this._namespace]) {
      this._state[this._namespace] = {};
    }
  }

  public get(key: string): any {
    return this._state[this._namespace][key];
  }

  public getAll(): Record<string, any> {
    return this._state[this._namespace];
  }

  public set(key: string, value: any, force = false): void {
    if (!force && this.has(key)) {
      throw new MigrateError(`Key already exists`);
    }

    this._state[this._namespace][key] = value;

    this._saveStateToFile();
  }

  public delete(key: string, force = false): void {
    if (!force && !this.has(key)) {
      throw new MigrateError(`Key not found`);
    }

    delete this._state[this._namespace][key];

    this._saveStateToFile();
  }

  public has(key: string): boolean {
    return this._state[this._namespace][key] !== undefined;
  }

  public clear(): void {
    this._state[this._namespace] = {};

    this._saveStateToFile();
  }
}

export const DefaultStorage = lazyObject(() => new BaseStorage());
export const UserStorage = lazyObject(() => new MigrateStorage(StorageNamespaces.Storage));
export const TransactionStorage = lazyObject(() => new MigrateStorage(StorageNamespaces.Transactions));
export const ArtifactStorage = lazyObject(() => new MigrateStorage(StorageNamespaces.Artifacts));
export const VerificationStorage = lazyObject(() => new MigrateStorage(StorageNamespaces.Verification));

import { existsSync, readFileSync, writeFileSync } from "fs";

import { lazyObject } from "hardhat/plugins";

import { MigrateError } from "../../errors";

import { catchError, resolvePathToFile, toJSON } from "../../utils";

import { StorageNamespaces } from "../../types/tools";

@catchError
export class Storage {
  private static readonly _fileName = ".storage.json";

  private static _state: Record<string, any> = lazyObject(() => Storage._readFullStateFromFile());

  constructor(private _namespace: StorageNamespaces = StorageNamespaces.Storage) {
    if (!Storage._state[this._namespace]) {
      Storage._state[this._namespace] = {};
    }
  }

  public get(key: string): any {
    return Storage._state[this._namespace][key];
  }

  public getAll(): Record<string, any> {
    return Storage._state[this._namespace];
  }

  public set(key: string, value: any, force = false): void {
    if (!force && this.has(key)) {
      throw new MigrateError(`Key already exists`);
    }

    Storage._state[this._namespace][key] = value;

    Storage._saveStateToFile();
  }

  public delete(key: string, force = false): void {
    if (!force && !this.has(key)) {
      throw new MigrateError(`Key not found`);
    }

    delete Storage._state[this._namespace][key];

    Storage._saveStateToFile();
  }

  public has(key: string): boolean {
    return Storage._state[this._namespace][key] !== undefined;
  }

  public clear(): void {
    Storage._state[this._namespace] = {};

    Storage._saveStateToFile();
  }

  private static _stateExistsInFile(): boolean {
    return existsSync(this._filePath());
  }

  private static _saveStateToFile() {
    writeFileSync(this._filePath(), toJSON(Storage._state), {
      flag: "w",
      encoding: "utf8",
    });
  }

  private static _readFullStateFromFile(): Record<string, Record<string, any>> {
    if (!Storage._stateExistsInFile()) {
      return {};
    }

    const fileContent = readFileSync(this._filePath(), {
      encoding: "utf8",
    });

    return JSON.parse(fileContent);
  }

  private static _filePath(): string {
    return resolvePathToFile("artifacts/build-info", Storage._fileName);
  }
}

export const DefaultStorage = lazyObject(() => new Storage(StorageNamespaces.Storage));
export const TransactionStorage = lazyObject(() => new Storage(StorageNamespaces.Transactions));
export const ArtifactStorage = lazyObject(() => new Storage(StorageNamespaces.Artifacts));
export const VerificationStorage = lazyObject(() => new Storage(StorageNamespaces.Verification));

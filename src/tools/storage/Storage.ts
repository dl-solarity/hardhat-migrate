import { existsSync, readFileSync, writeFileSync } from "fs";

import { MigrateError } from "../../errors";

import { StorageNamespaces } from "../../types/tools";

import { catchError, resolvePathToFile, toJSON } from "../../utils";

@catchError
export class Storage {
  private static readonly _fileName = ".storage.json";

  private static readonly _filePath = resolvePathToFile("artifacts/build-info", Storage._fileName);

  private static _state: Record<string, any> = Storage._readFullStateFromFile();

  constructor(private _namespace: StorageNamespaces = StorageNamespaces.Storage) {
    if (!Storage._state[this._namespace]) {
      Storage._state[this._namespace] = {};
    }
  }

  public get(key: string): any {
    return Storage._state[this._namespace][key];
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
    return existsSync(Storage._filePath);
  }

  private static _saveStateToFile() {
    writeFileSync(Storage._filePath, toJSON(Storage._state), {
      flag: "w",
      encoding: "utf8",
    });
  }

  private static _readFullStateFromFile(): Record<string, Record<string, any>> {
    if (!Storage._stateExistsInFile()) {
      return {};
    }

    const fileContent = readFileSync(this._filePath, {
      encoding: "utf8",
    });

    return JSON.parse(fileContent);
  }
}

export const DefaultStorage = new Storage(StorageNamespaces.Storage);
export const TransactionStorage = new Storage(StorageNamespaces.Transactions);
export const ArtifactStorage = new Storage(StorageNamespaces.Artifacts);

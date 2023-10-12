/* eslint-disable @typescript-eslint/no-explicit-any */
import { existsSync, readFileSync, writeFileSync } from "fs";
import { MigrateError } from "../../errors";
import { StorageNamespaces } from "../../types/tools";

import { JSONConvertor, catchError, resolvePathToFile } from "../../utils";

@catchError
export class Storage {
  private readonly _fileName = ".storage.json";

  private readonly _filePath: string;

  private _state: Record<string, any> = {};

  constructor(
    private _namespace: StorageNamespaces = StorageNamespaces.Storage,
    pathToStorage: string = "artifacts/build-info",
  ) {
    this._filePath = resolvePathToFile(pathToStorage, this._fileName);

    if (this._stateExistsInFile()) {
      this._state = this._readStateFromFile();
    }
  }

  public get(key: string): any {
    return this._state[key];
  }

  public set(key: string, value: any, force = false): void {
    if (!force && this.has(key)) {
      throw new MigrateError(`Key already exists`);
    }

    this._state[key] = value;

    this._saveStateToFile();
  }

  public delete(key: string, force = false): void {
    if (!force && !this.has(key)) {
      throw new MigrateError(`Key not found`);
    }

    delete this._state[key];

    this._saveStateToFile();
  }

  public has(key: string): boolean {
    return this._state[key] !== undefined;
  }

  public clear(): void {
    this._state = {};

    this._saveStateToFile();
  }

  private _stateExistsInFile(): boolean {
    return existsSync(this._filePath);
  }

  private _saveStateToFile() {
    const fullState = this._stateExistsInFile() ? this._readStateFromFile() : {};

    fullState[this._namespace] = this._state;

    const fileContent = this._toJSON(fullState);

    writeFileSync(this._filePath, fileContent, {
      flag: "w",
      encoding: "utf8",
    });
  }

  private _readStateFromFile(): Record<string, Record<string, any>> {
    const fileContent = readFileSync(this._filePath, {
      encoding: "utf8",
    });

    return JSON.parse(fileContent);
  }

  private _toJSON(data: any): string {
    return JSON.stringify(data, JSONConvertor, 2);
  }
}

export const DefaultStorage = new Storage(StorageNamespaces.Storage);
export const ArtifactStorage = new Storage(StorageNamespaces.Artifacts);
export const TransactionStorage = new Storage(StorageNamespaces.Transactions);

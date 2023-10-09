import { existsSync, readFileSync, writeFileSync } from "fs";

import { JSONConvertor, resolvePathToFile } from "../../utils";

class Storage {
  private readonly _fileName = ".storage.json";

  private readonly _filePath: string = "";
  private readonly _namespace: string = "";

  private _state: Record<string, any> = {};

  // TODO: default path to storage should be: artifacts/build-infos -> .storage.json
  constructor(namespace: string = "", pathToStorage: string = "") {
    this._namespace = namespace;
    this._filePath = resolvePathToFile(pathToStorage, this._fileName);

    if (!this._stateExistsInFile()) {
      this._clear();
    }

    this._state = this._readStateFromFile();
  }

  public get(key: string): any {
    return this._state[this._namespace][key];
  }

  // TODO: add force set and delete. So if key exists it will be overwritten, otherwise throw error
  public set(key: string, value: any): void {
    this._state[this._namespace][key] = value;

    this._saveStateToFile();
  }

  public delete(key: string): void {
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

  private _clear() {
    this._state = {};

    this._saveStateToFile();
  }

  private _stateExistsInFile(): boolean {
    return existsSync(this._filePath);
  }

  private _saveStateToFile() {
    const fileContent = this._toJSON(this._state);

    writeFileSync(this._filePath, fileContent, {
      flag: "w",
      encoding: "utf8",
    });
  }

  private _readStateFromFile(): Record<string, string> {
    const fileContent = readFileSync(this._filePath, {
      encoding: "utf8",
    });

    return JSON.parse(fileContent);
  }

  private _toJSON(data: any): string {
    return JSON.stringify(data, JSONConvertor);
  }
}

export const DefaultStorage = new Storage("storage");
export const ArtifactStorage = new Storage("artifacts");
export const TransactionStorage = new Storage("transactions");

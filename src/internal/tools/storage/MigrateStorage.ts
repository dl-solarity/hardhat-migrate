import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";

import { CatchClassError, MigrateError, resolvePathToFile, toJSON } from "../../utils/index.js";

import { StorageNamespaces } from "../../../types/index.js";

@CatchClassError
class BaseStorage {
  protected _state: Record<string, any>;
  private readonly _directory = "cache";
  private readonly _fileName = ".migrate.storage.json";

  constructor(private _namespace: string = StorageNamespaces.Storage) {
    this._state = this.readFullStateFromFile()[this._namespace] || {};

    if (!existsSync(this.filePath())) {
      this._saveStateToFile();
    }
  }

  public deleteStateFile(): void {
    if (this.stateExistsInFile()) {
      rmSync(this.filePath(), { force: true });
    }
  }

  public readFullStateFromFile(): Record<string, Record<string, any>> {
    if (!this.stateExistsInFile()) {
      return {};
    }

    const fileContent = readFileSync(this.filePath(), {
      encoding: "utf8",
    });

    return JSON.parse(fileContent);
  }

  public stateExistsInFile(): boolean {
    return existsSync(this.filePath());
  }

  public filePath(): string {
    return resolvePathToFile("cache", this._fileName);
  }

  protected _saveStateToFile() {
    const fileSate = this.readFullStateFromFile();

    fileSate[this._namespace] = this._state;

    if (!existsSync(this._directory)) {
      mkdirSync(this._directory, { recursive: true });
    }

    writeFileSync(this.filePath(), toJSON(fileSate), {
      flag: "w",
      encoding: "utf8",
    });
  }
}

@CatchClassError
export class MigrateStorage extends BaseStorage {
  public get(key: string): any {
    return this._state[key];
  }

  public getAll(): Record<string, any> {
    return this._state;
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
}

export const DefaultStorage = new BaseStorage();
export const UserStorage = new MigrateStorage(StorageNamespaces.Storage);
export const TransactionStorage = new MigrateStorage(StorageNamespaces.Transactions);
export const ArtifactStorage = new MigrateStorage(StorageNamespaces.Artifacts);
export const VerificationStorage = new MigrateStorage(StorageNamespaces.Verification);

export function clearAllStorage(): void {
  UserStorage!.clear();
  TransactionStorage!.clear();
  ArtifactStorage!.clear();
  VerificationStorage!.clear();
}

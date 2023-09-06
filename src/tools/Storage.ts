import { existsSync, readFileSync, writeFileSync } from "fs";
import { MigrateError } from "../errors";
import { resolvePathToFile } from "../utils";

// 1. Manual save
// 2. Load config
// 3. Types. -- *

export class Storage {
  private fileName = ".storage.json";

  private static instance: Storage;

  private _path?: string;

  private _storage: { [key: string]: any };

  private constructor() {
    this._storage = {};
  }

  public static getInstance(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }

    return Storage.instance;
  }

  public loadFromDisk(path: string) {
    this._path = resolvePathToFile(path, this.fileName);

    if (path && existsSync(this._path)) {
      try {
        this._storage = JSON.parse(readFileSync(this._path, { encoding: "utf8", flag: "r" }));
      } catch (e: any) {
        throw new MigrateError(`Error reading storage file: ${e.message}`);
      }
    }
  }

  public saveToDisk() {
    if (!this._path) throw new MigrateError("Storage path not set");

    const data = JSON.stringify(this._storage, undefined, 2);

    try {
      writeFileSync(this._path, data, {
        flag: "w",
        encoding: "utf8",
      });
    } catch (e: any) {
      throw new MigrateError(`Error writing storage file: ${e.message}`);
    }
  }

  public get(key: string): any {
    return this._storage[key];
  }

  public set(key: string, value: any): void {
    this._storage[key] = value;
  }

  public delete(key: string): void {
    delete this._storage[key];
  }

  public has(key: string): boolean {
    return this._storage[key] !== undefined;
  }

  public clear(): void {
    this._storage = {};
  }
}

import { existsSync, readFileSync, writeFileSync } from "fs";

import { MigrateError } from "../../errors";
import { resolvePathToFile } from "../../utils";

export class ManualStorage {
  private static _instance: ManualStorage;

  private readonly _fileName = ".storage.json";

  private _path?: string;

  private _storage: { [key: string]: any } = {};

  private constructor() {}

  public static getInstance(): ManualStorage {
    if (!ManualStorage._instance) {
      ManualStorage._instance = new ManualStorage();
    }

    return ManualStorage._instance;
  }

  public loadFromDisk(path: string) {
    this._path = resolvePathToFile(path, this._fileName);

    if (path && existsSync(this._path)) {
      try {
        this._storage = JSON.parse(readFileSync(this._path, { encoding: "utf8", flag: "r" }));
      } catch (e: unknown) {
        if (e instanceof Error) {
          throw new MigrateError(`Error reading storage file: ${e.message}`);
        }

        throw e;
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
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new MigrateError(`Error writing storage file: ${e.message}`);
      }

      throw e;
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

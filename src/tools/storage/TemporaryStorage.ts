export class TemporaryStorage {
  private static _instance: TemporaryStorage;
  private _storage: Map<any, any> = new Map();

  private constructor() {}

  public static getInstance(): TemporaryStorage {
    if (!TemporaryStorage._instance) {
      TemporaryStorage._instance = new TemporaryStorage();
    }

    return TemporaryStorage._instance;
  }

  public save(key: any, value: any): void {
    this._storage.set(key, value);
  }

  public get(key: any): any {
    return this._storage.get(key);
  }
}

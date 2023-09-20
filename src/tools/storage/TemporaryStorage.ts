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

  public save(key: any, value: any): void {
    this._storage[key] = value;
  }

  public get(key: any): any {
    return this._storage[key];
  }
}

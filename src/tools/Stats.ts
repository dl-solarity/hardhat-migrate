import { MigrationStats } from "../types/tools";

class BaseStats {
  private _stats: MigrationStats = {
    currentMigration: 0,
  };

  public get currentMigration(): number {
    return this._stats.currentMigration;
  }

  public set currentMigration(currentMigration: number) {
    this._stats.currentMigration = currentMigration;
  }
}

export const Stats = new BaseStats();

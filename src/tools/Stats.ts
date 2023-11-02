import { MigrationStats } from "../types/tools";

export class Stats {
  private static _stats: MigrationStats = {
    currentMigration: 0,
  };

  public static get currentMigration(): number {
    return this._stats.currentMigration;
  }

  public static set currentMigration(currentMigration: number) {
    this._stats.currentMigration = currentMigration;
  }
}

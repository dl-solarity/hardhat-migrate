import { basename, join } from "path";
import { existsSync, readdirSync, statSync } from "fs";

import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { pluginName } from "../constants";

import { MigrateError } from "../errors";

import { MigrateConfig } from "../types/migrations";

import { Deployer } from "../deployer/Deployer";

import { createLinker } from "../deployer/Linker";

import { Stats } from "../tools/Stats";

import { TransactionRunner } from "../tools/runners/TransactionRunner";
import { createAndInitReporter, Reporter } from "../tools/reporters/Reporter";

import { buildNetworkDeps } from "../tools/network/NetworkManager";

import { clearAllStorage } from "../tools/storage/MigrateStorage";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";
import { createTransactionProcessor } from "../tools/storage/TransactionProcessor";

export class Migrator {
  private readonly _deployer: Deployer;

  private readonly _migrationFiles: string[];

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _config: MigrateConfig = _hre.config.migrate,
  ) {
    this._deployer = new Deployer(_hre);

    this._migrationFiles = this._getMigrationFiles();
  }

  public async migrate() {
    Reporter!.reportMigrationBegin(this._migrationFiles);

    const migrationsDir = this._getMigrationDir();

    for (const element of this._migrationFiles) {
      Stats.currentMigration = this._getMigrationNumber(element);

      Reporter!.reportMigrationFileBegin(element);

      try {
        const migration = await import(join(migrationsDir, element));

        await migration.default(this._deployer);
      } catch (e: unknown) {
        if (e instanceof MigrateError) {
          throw new HardhatPluginError(pluginName, e.message, e);
        }

        throw e;
      }
    }

    TransactionRunner!.summary();

    await Reporter?.completeReport();
  }

  private _getMigrationFiles() {
    const migrationsDir = this._getMigrationDir();

    if (!existsSync(migrationsDir)) {
      throw new HardhatPluginError(pluginName, `Migrations directory not found at ${migrationsDir}`);
    }

    const directoryContents = readdirSync(migrationsDir);

    const files = directoryContents
      .filter((file) => {
        const migrationNumber = this._getMigrationNumber(file);

        if (
          isNaN(migrationNumber) ||
          migrationNumber <= 0 ||
          this._config.filter.from > migrationNumber ||
          (this._config.filter.to < migrationNumber && this._config.filter.to !== -1) ||
          (this._config.filter.only !== migrationNumber && this._config.filter.only !== -1) ||
          this._config.filter.skip === migrationNumber
        ) {
          return false;
        }

        return statSync(join(migrationsDir, file)).isFile();
      })
      .sort((a, b) => {
        return this._getMigrationNumber(a) - this._getMigrationNumber(b);
      });

    if (files.length === 0) {
      throw new HardhatPluginError(pluginName, "No migration files were found.");
    }

    return files;
  }

  private _getMigrationNumber(file: string) {
    return parseInt(basename(file));
  }

  private _getMigrationDir() {
    return join(this._hre.config.paths.root, this._config.paths.pathToMigrations, this._config.paths.namespace);
  }

  public static async buildMigrateTaskDeps(hre: HardhatRuntimeEnvironment): Promise<void> {
    createLinker(hre);
    createTransactionProcessor(hre.config.migrate);

    buildNetworkDeps(hre);
    await createAndInitReporter(hre);

    if (!hre.config.migrate.execution.continue) {
      clearAllStorage();
    }

    await ArtifactProcessor.parseArtifacts(hre);
  }
}

import { readdirSync, statSync } from "fs";
import { basename } from "path";

import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { pluginName } from "../constants";

import { resolvePathToFile } from "../utils";

import { MigrateError } from "../errors";

import { MigrateConfig } from "../types/migrations";

import { Linker } from "../deployer/Linker";
import { Deployer } from "../deployer/Deployer";
import { Verifier } from "../verifier/Verifier";

import { Stats } from "../tools/Stats";

import { initReporter, reporter } from "../tools/reporters/Reporter";
import { transactionRunner } from "../tools/runners/TransactionRunner";

import { initNetworkManager } from "../tools/network/NetworkManager";

import { TransactionProcessor } from "../tools/storage/TransactionProcessor";
import { MigrateStorage } from "../tools/storage/MigrateStorage";
import { ArtifactProcessor } from "../tools/storage/ArtifactProcessor";

export class Migrator {
  private readonly _deployer: Deployer;
  private readonly _verifier: Verifier;

  private readonly _migrationFiles: string[];

  constructor(
    _hre: HardhatRuntimeEnvironment,
    private _config: MigrateConfig = _hre.config.migrate,
  ) {
    this._deployer = new Deployer(_hre);
    this._verifier = new Verifier(_hre, {
      parallel: this._config.verifyParallel,
      attempts: this._config.verifyAttempts,
    });

    this._migrationFiles = this._getMigrationFiles();
  }

  public async migrate() {
    reporter!.reportMigrationBegin(this._migrationFiles);

    for (const element of this._migrationFiles) {
      Stats.currentMigration = this._getMigrationNumber(element);

      reporter!.reportMigrationFileBegin(element);

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const migration = require(resolvePathToFile(this._config.pathToMigrations, element));

        await migration(this._deployer, this._verifier);
      } catch (e: unknown) {
        if (e instanceof MigrateError) {
          throw new HardhatPluginError(pluginName, e.message, e);
        }

        throw e;
      }
    }

    transactionRunner!.summary();
  }

  private _getMigrationFiles() {
    const migrationsDir = resolvePathToFile(this._config.pathToMigrations);
    const directoryContents = readdirSync(migrationsDir);

    const files = directoryContents
      .filter((file) => {
        const migrationNumber = this._getMigrationNumber(file);

        if (
          isNaN(migrationNumber) ||
          migrationNumber <= 0 ||
          this._config.from > migrationNumber ||
          (this._config.to < migrationNumber && this._config.to !== -1) ||
          (this._config.only !== migrationNumber && this._config.only !== -1) ||
          this._config.skip === migrationNumber
        ) {
          return false;
        }

        return statSync(resolvePathToFile(this._config.pathToMigrations, file)).isFile();
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

  public static async initializeDependencies(hre: HardhatRuntimeEnvironment): Promise<void> {
    Linker.setConfig(hre.config.migrate);
    TransactionProcessor.setConfig(hre.config.migrate);

    initNetworkManager(hre);
    await initReporter(hre.config.migrate);

    if (!hre.config.migrate.continue) {
      MigrateStorage.clearAll();
    }

    await ArtifactProcessor.parseArtifacts(hre);
  }
}

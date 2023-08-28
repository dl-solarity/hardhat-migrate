import fs = require("fs");
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { pluginName } from "../constants";
import { Deployer } from "../deployer/Deployer";
import { MigrateConfig } from "../types/migrations";
import { resolvePathToFile } from "../utils/files";
import path = require("path");

export class Migrator {
  private _config: MigrateConfig;
  private _deployer: Deployer;
  private _migrationFiles: string[];

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;

    const provider = this._hre.network.provider;
    this._deployer = new Deployer(provider);

    this._migrationFiles = this.getMigrationFiles();
  }

  public async migrate() {
    for (const element of this._migrationFiles) {
      const migration = require(resolvePathToFile(this._config.pathToMigrations, element));

      await migration(this._deployer);
    }
  }

  private getMigrationFiles() {
    const migrationsDir = resolvePathToFile(this._config.pathToMigrations);
    const directoryContents = fs.readdirSync(migrationsDir);

    let files = directoryContents
      .filter((file) => {
        let migrationNumber = parseInt(path.basename(file));

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

        return fs.statSync(migrationsDir + file).isFile();
      })
      .sort((a, b) => {
        return parseInt(path.basename(a)) - parseInt(path.basename(b));
      });

    if (files.length === 0) {
      throw new NomicLabsHardhatPluginError(pluginName, "No migration files were found.");
    }

    return files;
  }
}

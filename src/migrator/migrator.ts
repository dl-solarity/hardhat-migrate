import { readdirSync, statSync } from "fs";
import { basename } from "path";

import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { pluginName } from "../constants";
import { resolvePathToFile } from "../utils";

import { MigrateError } from "../errors";

import { MigrateConfig } from "../types/migrations";

import { Deployer } from "../deployer/Deployer";

import { FileHistory } from "../tools/storage/FileHistory";

export class Migrator {
  private _deployer: Deployer;

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _config: MigrateConfig = _hre.config.migrate,
  ) {
    this._deployer = new Deployer(_hre, _config.pluginName);
  }

  public async migrate() {
    const fileHistory = new FileHistory(this._hre, this._config.pathToMigrations);

    const migrationsDifferent = fileHistory.getMigrationFilesDifferent(
      resolvePathToFile(this._config.pathToMigrations),
    );

    const migrationFiles = this.getMigrationFiles(migrationsDifferent);
    // TODO: add more logic to sort migration files starting with the first one modified
    // Or as idea we may generate a file replacing the code of deployer with the address of already deployed contract
    // Or we may create custom comment in the migration file that specifies the place where the migrator should start

    for (const element of migrationFiles) {
      try {
        // eslint-disable-next-line
        const migration = require(resolvePathToFile(this._config.pathToMigrations, element));

        await migration(this._deployer);
      } catch (e: any) {
        if (e instanceof MigrateError) {
          throw new HardhatPluginError(pluginName, e.message);
        }

        throw e;
      }
    }
  }

  // TODO: add files from parameter to migrationFiles forcibly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private getMigrationFiles(filesToInclude?: string[]) {
    const migrationsDir = resolvePathToFile(this._config.pathToMigrations);
    const directoryContents = readdirSync(migrationsDir);

    const files = directoryContents
      .filter((file) => {
        const migrationNumber = parseInt(basename(file));

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
        return parseInt(basename(a)) - parseInt(basename(b));
      });

    if (files.length === 0) {
      throw new HardhatPluginError(pluginName, "No migration files were found.");
    }

    return files;
  }
}

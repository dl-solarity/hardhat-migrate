import { readdirSync, statSync } from "fs";
import { basename } from "path";

import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { pluginName } from "../constants";

import { resolvePathToFile } from "../utils";

import { MigrateError } from "../errors";

import { MigrateConfig } from "../types/migrations";

import { Deployer } from "../deployer/Deployer";
import { Sender } from "../sender/Sender";
import { Reporter } from "../tools/reporter/Reporter";

export class Migrator {
  private readonly _deployer: Deployer;
  private readonly _sender: Sender;
  private readonly _migrationFiles: string[];

  constructor(
    _hre: HardhatRuntimeEnvironment,
    private _config: MigrateConfig = _hre.config.migrate,
  ) {
    this._deployer = new Deployer(_hre);
    this._sender = new Sender(Reporter.getInstance());

    this._migrationFiles = this._getMigrationFiles();
  }

  public async migrate() {
    Reporter.getInstance().reportMigrationBegin(this._migrationFiles);

    for (const element of this._migrationFiles) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const migration = require(resolvePathToFile(this._config.pathToMigrations, element));

        await migration(this._deployer, this._sender);
      } catch (e: unknown) {
        if (e instanceof MigrateError) {
          throw new HardhatPluginError(pluginName, e.message, e);
        }

        throw e;
      }
    }

    await Reporter.getInstance().summary();
  }

  private _getMigrationFiles() {
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

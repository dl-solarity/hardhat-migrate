import { readdirSync, statSync } from "fs";
import { basename } from "path";

import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { pluginName } from "../constants";
import { resolvePathToFile } from "../utils";

import { MigrateError } from "../errors";

import { Adapter } from "../types/adapter";
import { MigrateConfig, PluginName } from "../types/migrations";

import { Deployer } from "../deployer/Deployer";

import { EthersAdapter } from "../deployer/adapters/EthersAdapter";
import { PureAdapter } from "../deployer/adapters/PureAdapter";
import { TruffleAdapter } from "../deployer/adapters/TruffleAdapter";

import { Reporter } from "../tools/reporter/Reporter";
import { FileHistory } from "../tools/storage/FileHistory";

export class Migrator {
  private _config: MigrateConfig;
  private _deployer: Deployer;
  private _reporter: Reporter;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
    this._reporter = new Reporter(this._hre);

    let adapter: Adapter;

    switch (this._config.pluginName) {
      case PluginName.ETHERS:
        adapter = new EthersAdapter(this._hre);
        break;
      case PluginName.TRUFFLE:
        adapter = new TruffleAdapter(this._hre);
        break;
      case PluginName.PURE:
      default:
        adapter = new PureAdapter(this._hre);
    }
    this._deployer = new Deployer(_hre, adapter, this._reporter);
  }

  public async migrate() {
    const fileHistory = new FileHistory(this._hre, this._config.pathToMigrations);

    const migrationsDifferent = fileHistory.getMigrationFilesDifferent(
      resolvePathToFile(this._config.pathToMigrations),
    );

    const migrationFiles = this.getMigrationFiles(migrationsDifferent);

    for (const element of migrationFiles) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
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

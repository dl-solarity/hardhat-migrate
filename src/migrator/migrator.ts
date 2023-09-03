import fs = require("fs");
import { HardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { pluginName } from "../constants";
import { EthersAdapter } from "../deployer/adapters/EthersAdapter";
import { PureAdapter } from "../deployer/adapters/PureAdapter";
import { TruffleAdapter } from "../deployer/adapters/TruffleAdapter";
import { TypeChainAdapter } from "../deployer/adapters/TypeChainAdapter";
import { Deployer } from "../deployer/Deployer";
import { MigrateError } from "../errors";
import { Reporter } from "../tools/Reporter";
import { Adapter } from "../types/adapter";
import { MigrateConfig, PluginName } from "../types/migrations";
import { resolvePathToFile } from "../utils/files";
import path = require("path");

export class Migrator {
  private _config: MigrateConfig;
  private _deployer: Deployer;
  private _reporter: Reporter;
  private _migrationFiles: string[];

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
    this._reporter = new Reporter();

    let adapter: Adapter;

    switch (this._config.pluginName) {
      case PluginName.ETHERS:
        adapter = new EthersAdapter();
        break;
      case PluginName.TRUFFLE:
        adapter = new TruffleAdapter();
        break;
      case PluginName.TYPECHAIN:
        adapter = new TypeChainAdapter();
        break;
      case PluginName.PURE:
      default:
        adapter = new PureAdapter();
    }
    this._deployer = new Deployer(_hre, adapter, this._reporter);

    this._migrationFiles = this.getMigrationFiles();
  }

  public async migrate() {
    for (const element of this._migrationFiles) {
      try {
        const migration = require(resolvePathToFile(this._config.pathToMigrations, element));

        await migration(this._deployer);
      } catch (e: any) {
        if (e instanceof MigrateError) {
          console.log(e);
          throw new HardhatPluginError(pluginName, e.message);
        }

        throw e;
      }
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

        return fs.statSync(resolvePathToFile(this._config.pathToMigrations, file)).isFile();
      })
      .sort((a, b) => {
        return parseInt(path.basename(a)) - parseInt(path.basename(b));
      });

    if (files.length === 0) {
      throw new HardhatPluginError(pluginName, "No migration files were found.");
    }

    return files;
  }
}

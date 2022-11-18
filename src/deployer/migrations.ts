import fs = require("fs");
import path = require("path");
import { Deployer } from "./deployer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";

export class Migrations {
  readonly _verify: boolean;
  readonly _confirmations: number;
  readonly _pathToMigration: string;
  readonly from: number;
  readonly to: number;
  readonly only: number;
  readonly _hre: HardhatRuntimeEnvironment;

  constructor(
    hre_: HardhatRuntimeEnvironment,
    verify_: boolean,
    confirmations_: number,
    pathToMigration_: string,
    from: number,
    to: number,
    only: number
  ) {
    this._hre = hre_;
    this._verify = verify_;
    this._confirmations = confirmations_;
    this._pathToMigration = pathToMigration_;
    this.from = from;
    this.to = to;
    this.only = only;
  }

  getMigrationFiles() {
    const migrationsDir = this.resolvePathToFile(this._pathToMigration);
    const directoryContents = fs.readdirSync(migrationsDir);

    let files = directoryContents
      .filter((file) => !isNaN(parseInt(path.basename(file))))
      .filter((file) => fs.statSync(migrationsDir + file).isFile())
      .filter((file) => {
        let migrationNumber = parseInt(path.basename(file));
        if ((this.from > migrationNumber || (this.to < migrationNumber && this.to != -1)) && this.only == -1) {
          return false;
        }

        return true;
      })
      .filter((file) => {
        let migrationNumber = parseInt(path.basename(file));
        if (this.only != migrationNumber && this.only != -1) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        return parseInt(path.basename(a)) - parseInt(path.basename(b));
      });

    if (files.length === 0) {
      throw new NomicLabsHardhatPluginError(pluginName, "No migration files were found.");
    }

    console.log(files)

    return files;
  }

  getParams(): [boolean, number] {
    if (this._verify) {
      console.log("\nAUTO VERIFICATION IS ON");
      console.log("\nNUMBER OF CONFIRMATIONS: " + this._confirmations);
    }

    return [this._verify, this._confirmations];
  }

  async migrate() {
    try {
      const migrationFiles = this.getMigrationFiles();
      const deployer = new Deployer(this._hre);
      await deployer.startMigration(...this.getParams());

      for (const element of migrationFiles) {
        const migration = require(this.resolvePathToFile(fs.realpathSync(this._pathToMigration), element));

        await migration(deployer);
      }

      await deployer.finishMigration();

      process.exit(0);
    } catch (e: any) {
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }

  resolvePathToFile(path_: string, file: string = ""): string {
    let pathToFile = fs.realpathSync(path_);
    if (pathToFile.substring(pathToFile.length - 1, pathToFile.length) === "/") {
      return pathToFile + file;
    }
    return pathToFile + "/" + file;
  }
}

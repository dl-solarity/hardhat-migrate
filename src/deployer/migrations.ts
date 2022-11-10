import fs = require("fs");
import path = require("path");
import { Deployer } from "./deployer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";

export class Migrations {
  readonly _verify: boolean = false;
  readonly _confirmations: number = 1;
  readonly _pathToMigration: string = "./deploy/migrations/";
  readonly _hre: HardhatRuntimeEnvironment;

  constructor(
    hre_: HardhatRuntimeEnvironment,
    verify_?: boolean,
    confirmations_?: number,
    pathToMigration_?: string
  ) {
    this._hre = hre_;

    if (verify_ !== undefined) {
      this._verify = verify_;
    }
    if (confirmations_ !== undefined) {
      this._confirmations = confirmations_;
    }
    if (pathToMigration_ !== undefined) {
      this._pathToMigration = pathToMigration_;
    }
  }

  getMigrationFiles() {
    const migrationsDir = this._pathToMigration;
    const directoryContents = fs.readdirSync(migrationsDir);

    return directoryContents
      .filter((file) => !isNaN(parseInt(path.basename(file))))
      .filter((file) => fs.statSync(migrationsDir + file).isFile())
      .sort((a, b) => {
        return parseInt(path.basename(a)) - parseInt(path.basename(b));
      });
  }

  getParams(): [boolean, number] {
    if (this._verify) {
      console.log("\nAUTO VERIFICATION IS ON");
    }

    return [this._verify, this._confirmations];
  }

  async migrate() {
    try {
      const migrationFiles = this.getMigrationFiles();
      const deployer = new Deployer(this._hre);

      await deployer.startMigration(...this.getParams());

      console.log(migrationFiles);

      for (const element of migrationFiles) {
        const migration = require("../../migrations/" + element);

        await migration(deployer);
      }

      await deployer.finishMigration();

      process.exit(0);
    } catch (e: any) {
      console.log(e.message);
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }
}

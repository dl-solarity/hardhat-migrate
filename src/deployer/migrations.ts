import fs = require("fs");
import path = require("path");
import { Deployer } from "./deployer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";

export class Migrations {
  constructor(
    private hre: HardhatRuntimeEnvironment,
    private verify: boolean,
    private confirmations: number,
    private pathToMigration: string,
    private from: number,
    private to: number,
    private only: number,
    private skip: number[],
    private skipVerificationErrors: string[],
    private verificationAttempts: number
  ) {}

  getMigrationFiles() {
    const migrationsDir = this.resolvePathToFile(this.pathToMigration);
    const directoryContents = fs.readdirSync(migrationsDir);

    let files = directoryContents
      .filter((file) => !isNaN(parseInt(path.basename(file))))
      .filter((file) => fs.statSync(migrationsDir + file).isFile())
      .filter((file) => {
        let migrationNumber = parseInt(path.basename(file));
        if (this.from > migrationNumber || (this.to < migrationNumber && this.to != -1)) {
          return false;
        }

        return true;
      })
      .filter((file) => {
        let migrationNumber = parseInt(path.basename(file));
        if (this.only != migrationNumber && this.only != -1 && !this.skip.includes(this.only)) {
          return false;
        }

        return true;
      })
      .filter((file) => {
        let migrationNumber = parseInt(path.basename(file));
        if (this.skip.includes(migrationNumber)) {
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

    console.log(files);

    return files;
  }

  getParams(): [boolean, number, number] {
    if (this.verify) {
      console.log("\nAUTO VERIFICATION IS ON");
      console.log("\nNUMBER OF CONFIRMATIONS: " + this.confirmations);
      console.log("\nNUMBER OF VERIFICATION ATTEMPTS: " + this.verificationAttempts);
    }

    return [this.verify, this.confirmations, this.verificationAttempts];
  }

  async migrate() {
    try {
      const migrationFiles = this.getMigrationFiles();
      const deployer = new Deployer(this.hre, this.skipVerificationErrors);
      await deployer.startMigration(...this.getParams());

      for (const element of migrationFiles) {
        const migration = require(this.resolvePathToFile(fs.realpathSync(this.pathToMigration), element));

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

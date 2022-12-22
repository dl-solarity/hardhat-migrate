import fs = require("fs");
import path = require("path");
import { Deployer } from "./deployer";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { pluginName } from "../constants";
import { Logger } from "../logger/logger";
import { Verifier } from "../verifier/verifier";

export class Migrations {
  constructor(
    private hre: HardhatRuntimeEnvironment,
    private from: number,
    private to: number,
    private only: number,
    private skip: number,
    private verify: boolean,
    private confirmations: number,
    private skipVerificationErrors: string[],
    private attempts: number,
    private pathToMigration: string
  ) {}

  getMigrationFiles() {
    const migrationsDir = this.resolvePathToFile(this.pathToMigration);
    const directoryContents = fs.readdirSync(migrationsDir);

    let files = directoryContents
      .filter((file) => {
        let migrationNumber = parseInt(path.basename(file));

        return !isNaN(migrationNumber) && migrationNumber > 0;
      })
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

        if (this.only != migrationNumber && this.only != -1) {
          return false;
        }

        return true;
      })
      .filter((file) => {
        let migrationNumber = parseInt(path.basename(file));

        if (this.skip == migrationNumber) {
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

    console.log("\nMigration files:", files);

    return files;
  }

  getParams(): [boolean, number, number] {
    if (!this.verify && this.attempts > 0) {
      throw new NomicLabsHardhatPluginError(pluginName, "attempts > 0 with missing verify flag");
    }

    return [this.verify, this.confirmations, this.attempts];
  }

  async migrate() {
    try {
      const migrationFiles = this.getMigrationFiles();
      const deployer = new Deployer(this.hre, this.skipVerificationErrors);

      await deployer.startMigration(...this.getParams());

      const logger = new Logger();

      for (const element of migrationFiles) {
        const migration = require(this.resolvePathToFile(fs.realpathSync(this.pathToMigration), element));

        await migration(deployer, logger);
      }

      await deployer.finishMigration(logger);

      process.exit(0);
    } catch (e: any) {
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }

  async batchVerify() {
    try {
      const migrationFiles = this.getMigrationFiles();
      const verifier = new Verifier(this.hre, this.attempts, this.skipVerificationErrors);

      for (const element of migrationFiles) {
        const migration = require(this.resolvePathToFile(fs.realpathSync(this.pathToMigration), element));

        await migration(verifier);
      }

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

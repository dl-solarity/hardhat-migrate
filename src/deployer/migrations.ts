import fs = require("fs");
import path = require("path");

import { HardhatRuntimeEnvironment } from "hardhat/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";

import { Deployer } from "./deployer";
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

  async migrate() {
    try {
      const migrationFiles = this.getMigrationFiles();
      const deployer = new Deployer(this.hre, this.skipVerificationErrors);
      const verifier = new Verifier(this.hre, this.attempts, this.skipVerificationErrors);
      const logger = new Logger(this.hre);

      await logger.init();

      await deployer.startMigration(logger, ...this.getParams());

      for (const element of migrationFiles) {
        const migration = require(this.resolvePathToFile(this.pathToMigration, element));

        await migration(deployer, logger, verifier);
      }

      await deployer.finishMigration(logger);

      process.exit(0);
    } catch (e: any) {
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }

  async migrateVerify() {
    try {
      const migrationFiles = this.getMigrationFiles();
      const verifier = new Verifier(this.hre, this.attempts, this.skipVerificationErrors);

      for (const element of migrationFiles) {
        const migration = require(this.resolvePathToFile(this.pathToMigration, element));

        await migration(verifier);
      }

      process.exit(0);
    } catch (e: any) {
      throw new NomicLabsHardhatPluginError(pluginName, e.message);
    }
  }

  private getMigrationFiles() {
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

  private getParams(): [boolean, number, number] {
    if (!this.verify && this.attempts > 0) {
      throw new NomicLabsHardhatPluginError(pluginName, "attempts > 0 with missing verify flag");
    }

    return [this.verify, this.confirmations, this.attempts];
  }

  private resolvePathToFile(path_: string, file_: string = ""): string {
    return path.normalize(fs.realpathSync(path_) + "/" + file_);
  }
}

import fs = require("fs");
import path = require("path");
import { Deployer } from "./deployer";

export class Migrations {
  getMigrationFiles(pathToDeploy: string = "./deploy/migrations/") {
    const migrationsDir = pathToDeploy;
    const directoryContents = fs.readdirSync(migrationsDir);

    return directoryContents
      .filter((file) => !isNaN(parseInt(path.basename(file))))
      .filter((file) => fs.statSync(migrationsDir + file).isFile())
      .sort((a, b) => {
        return parseInt(path.basename(a)) - parseInt(path.basename(b));
      });
  }

  isVerify() {
    return process.env.VERIFY == "true";
  }

  confirmations():number {
    return Number(process.env.CONFIRMATIONS);
  }

  getParams(): [boolean, number] {
    const verify = this.isVerify();
    let confirmations = 0;

    if (verify) {
      console.log("\nAUTO VERIFICATION IS ON");

      confirmations = 5;
    }

    if (this.confirmations() !== undefined) {
      confirmations = this.confirmations();
    }

    return [verify, confirmations];
  }

  async migrate() {
    try {
      const migrationFiles = this.getMigrationFiles();
      const deployer = new Deployer();

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
      process.exit(1);
    }
  }
}

// let migrations = new Migrations();
//
// migrations.migrate().then();

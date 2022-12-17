import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Migrations } from "../../src/deployer/migrations";

import path from "path";

declare module "mocha" {
  interface Context {
    env: HardhatRuntimeEnvironment;
  }
}

export function useEnvironment(fixtureProjectName: string, networkName = "hardhat") {
  beforeEach("Loading hardhat environment", function () {
    process.chdir(path.join(__dirname, "fixture-projects", fixtureProjectName));
    process.env.HARDHAT_NETWORK = networkName;

    this.env = require("hardhat");
  });

  afterEach("Resetting hardhat", function () {
    resetHardhatContext();
  });
}

export function getMigrationInstanceFromConfig(env: HardhatRuntimeEnvironment, migrate: any) {
  return new Migrations(
    env,
    migrate.verify,
    migrate.confirmations,
    migrate.pathToMigrations,
    migrate.from,
    migrate.to,
    migrate.only,
    migrate.skip,
    migrate.skipVerificationErrors,
    migrate.attempts
  );
}

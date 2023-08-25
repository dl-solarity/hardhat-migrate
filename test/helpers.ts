import { resetHardhatContext } from "hardhat/plugins-testing";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import path from "path";

declare module "mocha" {
  interface Context {
    env: HardhatRuntimeEnvironment;
  }
}

export function useEnvironment(fixtureProjectName: string, networkName = "hardhat") {
  beforeEach("Loading hardhat environment", function () {
    const prefix = "hardhat-project-";
    process.chdir(path.join(__dirname, "fixture-projects", prefix + fixtureProjectName));
    process.env.HARDHAT_NETWORK = networkName;

    this.env = require("hardhat");
  });

  afterEach("Resetting hardhat", function () {
    resetHardhatContext();
  });
}

import { join } from "path";

import { HardhatEthersProvider } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";
import { ethers } from "ethers";
import { resetHardhatContext } from "hardhat/plugins-testing";

export function useEnvironment(fixtureProjectName: string, networkName = "hardhat") {
  beforeEach("Loading hardhat environment", async function () {
    const prefix = "hardhat-project-";
    process.chdir(join(__dirname, "fixture-projects", prefix + fixtureProjectName));
    process.env.HARDHAT_NETWORK = networkName;

    this.hre = require("hardhat");
    this.hre.ethers = ethers;
    this.hre.ethers.provider = new HardhatEthersProvider(this.hre.network.provider, this.hre.network.name);

    // TODO: Delete this at the end of the refactor
    await this.hre.run("clean");

    await this.hre.run("compile", { quiet: true });
  });

  afterEach("Resetting hardhat", function () {
    resetHardhatContext();
  });
}

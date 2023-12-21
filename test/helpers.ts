import { join } from "path";

import { resetHardhatContext } from "hardhat/plugins-testing";

import { resetNetworkManager } from "../src/tools/network/NetworkManager";
import { resetEthersProvider } from "../src/tools/network/EthersProvider";
import { resetTransactionRunner } from "../src/tools/runners/TransactionRunner";

export function useEnvironment(fixtureProjectName: string, networkName = "hardhat") {
  beforeEach("Loading hardhat environment", async function () {
    resetEthersProvider();
    resetNetworkManager();
    resetTransactionRunner();

    const prefix = "hardhat-project-";
    process.chdir(join(__dirname, "fixture-projects", prefix + fixtureProjectName));
    process.env.HARDHAT_NETWORK = networkName;

    this.hre = require("hardhat");

    await this.hre.run("compile", { quiet: true });
  });

  afterEach("Resetting hardhat", function () {
    resetHardhatContext();
  });
}

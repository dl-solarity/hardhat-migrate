import path from "path";

import { fileURLToPath } from "url";

import "../src/type-extensions.js";

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { createHardhatRuntimeEnvironment } from "hardhat/hre";
import { resetReporter } from "../src/internal/tools/reporters/Reporter.js";
import { resetEthersProvider } from "../src/internal/tools/network/EthersProvider.js";
import { resetNetworkManager } from "../src/internal/tools/network/NetworkManager.js";
import { resetTransactionRunner } from "../src/internal/tools/runners/TransactionRunner.js";

declare module "mocha" {
  interface Context {
    hre: HardhatRuntimeEnvironment;
    _cwd?: string;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function useEnvironment(fixtureProjectName: string, networkName = "hardhat") {
  beforeEach("Loading hardhat environment", async function () {
    resetReporter();
    resetEthersProvider();
    resetNetworkManager();
    resetTransactionRunner();

    this._cwd = process.cwd();

    const prefix = "hardhat-project-";
    const projectPath = path.join(__dirname, "fixture-projects", prefix + fixtureProjectName);
    const configPath = path.join(__dirname, "fixture-projects", prefix + fixtureProjectName, "hardhat.config.ts");

    process.chdir(projectPath);
    process.env.HARDHAT_NETWORK = networkName;

    this.hre = await createHardhatRuntimeEnvironment(
      (await import(configPath)).default,
      { config: configPath },
      projectPath,
    );

    await this.hre.tasks.getTask("compile").run({ quiet: true });
  });

  afterEach("Resetting hardhat", async function () {
    // await this.hre.tasks.getTask("clean").run({});
  });
}

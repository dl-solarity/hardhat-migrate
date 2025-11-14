import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { runWithContinue, runWithoutContinue } from "./helper.js";

import { useEnvironment } from "../../helpers.js";
import { createAndInitReporter } from "../../../src/internal/tools/reporters/Reporter.js";
import { resetTransactionRunner } from "../../../src/internal/tools/runners/TransactionRunner.js";
import { expect } from "chai";
import { existsSync, readdirSync, rmSync, statSync } from "fs";
import { join } from "path";

describe("reporter-path", () => {
  useEnvironment("typechain-ethers");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetTransactionRunner();
    await createAndInitReporter(hre);
  });

  describe("custom report paths", () => {
    it("should save report into specified directory", async function () {
      await runWithoutContinue(hre, { only: 1, reportPath: "custom-path" });

      expect(readdirSync(join(hre.config.paths.root, "custom-path")).length).to.be.gte(1);
    });
  });

  after(async () => {
    rmSync(join(hre.config.paths.root, "custom-path"), { recursive: true, force: true });
  });
});

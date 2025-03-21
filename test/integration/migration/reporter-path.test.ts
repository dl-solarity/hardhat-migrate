import { HardhatRuntimeEnvironment } from "hardhat/types";

import { runWithContinue, runWithoutContinue } from "./helper";

import { useEnvironment } from "../../helpers";
import { createAndInitReporter } from "../../../src/tools/reporters/Reporter";
import { resetTransactionRunner } from "../../../src/tools/runners/TransactionRunner";
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
      await runWithoutContinue(hre, { only: 1, saveReportPath: "custom-path" });

      expect(readdirSync(join(hre.config.paths.root, "custom-path")).length).to.be.gte(1);
    });
  });

  after(async () => {
    rmSync(join(hre.config.paths.root, "custom-path"), { recursive: true, force: true });
  });
});

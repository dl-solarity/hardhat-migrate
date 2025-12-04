import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { runWithoutContinue } from "../migration/helper.js";

import { useEnvironment } from "../../helpers.js";
import { resetReporter } from "../../../src/internal/tools/reporters/Reporter.js";
import { resetTransactionRunner } from "../../../src/internal/tools/runners/TransactionRunner.js";

describe.skip("cast integration", () => {
  useEnvironment("cast-integration");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetReporter();
    resetTransactionRunner();
  });

  describe("migration flow with namespaces", () => {
    it("should run the core migration", async function () {
      await runWithoutContinue(hre, { only: 1 });
    });

    it("should run the migration where from is set to account name", async function () {
      await runWithoutContinue(hre, { only: 2 });
    });
  });
});

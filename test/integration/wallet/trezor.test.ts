import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { runWithoutContinue } from "../migration/helper.js";

import { useEnvironment } from "../../helpers.js";
import { resetReporter } from "../../../src/internal/tools/reporters/Reporter.js";
import { resetTransactionRunner } from "../../../src/internal/tools/runners/TransactionRunner.js";

describe.skip("trezor integration", () => {
  useEnvironment("trezor-integration");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetReporter();
    resetTransactionRunner();
  });

  describe("migration flow with namespaces", () => {
    it("should run the core migration", async function () {
      await runWithoutContinue(hre, {});
    });
  });
});

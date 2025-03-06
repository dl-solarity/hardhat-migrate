import { HardhatRuntimeEnvironment } from "hardhat/types";

import { runWithoutContinue } from "../migration/helper";

import { useEnvironment } from "../../helpers";
import { resetReporter } from "../../../src/tools/reporters/Reporter";
import { resetTransactionRunner } from "../../../src/tools/runners/TransactionRunner";

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
      await runWithoutContinue(hre, {} as any);
    });
  });
});

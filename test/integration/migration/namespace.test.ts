import { join } from "path";
import { expect } from "chai";

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { runWithContinue, runWithoutContinue } from "./helper.js";

import { useEnvironment } from "../../helpers.js";
import { resetReporter } from "../../../src/internal/tools/reporters/Reporter.js";
import { resetTransactionRunner } from "../../../src/internal/tools/runners/TransactionRunner.js";

describe("namespaces", () => {
  useEnvironment("namespace");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetReporter();
    resetTransactionRunner();
  });

  describe("migration flow with namespaces", () => {
    it("should run the core migration", async function () {
      await runWithoutContinue(hre, { namespace: "core" });

      await runWithoutContinue(hre, { namespace: "additional", continue: true });
    });

    it("should revert if the namespace is not found", async function () {
      const expectedErrorMessage = `Migrations directory not found at ${join(hre.config.paths.root, "deploy", "not-found")}`;

      await expect(runWithContinue(hre, { namespace: "not-found" })).to.be.rejectedWith(expectedErrorMessage);
    });
  });
});

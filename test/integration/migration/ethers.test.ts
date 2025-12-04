import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { runWithContinue, runWithoutContinue } from "./helper.js";

import { useEnvironment } from "../../helpers.js";
import { resetReporter } from "../../../src/internal/tools/reporters/Reporter.js";
import { resetTransactionRunner } from "../../../src/internal/tools/runners/TransactionRunner.js";

describe("ethers", () => {
  useEnvironment("ethers");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetReporter();
    resetTransactionRunner();
  });

  describe("simple migration flow", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, { only: 1 });
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, { only: 1 });
    });
  });

  describe("migration flow with libraries pre-deployment", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, { only: 2 });
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, { only: 2 });
    });
  });

  describe("migration flow for edge cases", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, { only: 3 });
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, { only: 3 });
    });
  });
});

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { runWithContinue, runWithoutContinue } from "./helper";

import { useEnvironment } from "../../helpers";
import { resetReporter } from "../../../src/tools/reporters/Reporter";
import { resetTransactionRunner } from "../../../src/tools/runners/TransactionRunner";

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

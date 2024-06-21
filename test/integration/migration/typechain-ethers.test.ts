import { HardhatRuntimeEnvironment } from "hardhat/types";

import { runWithContinue, runWithoutContinue } from "./helper";

import { useEnvironment } from "../../helpers";
import { resetReporter } from "../../../src/tools/reporters/Reporter";
import { resetTransactionRunner } from "../../../src/tools/runners/TransactionRunner";

describe("typechain-ethers", () => {
  useEnvironment("typechain-ethers");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetReporter();
    resetTransactionRunner();
  });

  describe("simple migration flow", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, 1);
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, 1);
    });
  });

  describe("migration flow with libraries pre-deployment", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, 2);
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, 2);
    });
  });

  describe("migration flow for edge cases", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, 3);
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, 3);
    });
  });

  describe("migration flow for edge cases", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, 4);
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, 4);
    });
  });
});

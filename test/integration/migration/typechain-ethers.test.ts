import { HardhatRuntimeEnvironment } from "hardhat/types";

import { runWithContinue, runWithoutContinue } from "./helper";

import { useEnvironment } from "../../helpers";
import { createAndInitReporter } from "../../../src/tools/reporters/Reporter";
import { resetTransactionRunner } from "../../../src/tools/runners/TransactionRunner";

describe("typechain-ethers", () => {
  useEnvironment("typechain-ethers");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetTransactionRunner();
    await createAndInitReporter(hre);
  });

  describe("simple migration flow", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, { only: 1 } as any);
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, { only: 1 } as any);
    });
  });

  describe("migration flow with libraries pre-deployment", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, { only: 2 } as any);
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, { only: 2 } as any);
    });
  });

  describe("migration flow for edge cases", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, { only: 3 } as any);
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, { only: 3 } as any);
    });
  });

  describe("migration flow for edge cases", () => {
    it("should run migration successfully", async function () {
      await runWithoutContinue(hre, { only: 4 } as any);
    });

    it("should recover migration successfully", async function () {
      await runWithContinue(hre, { only: 4 } as any);
    });
  });
});

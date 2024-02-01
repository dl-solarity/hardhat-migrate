import { HardhatRuntimeEnvironment } from "hardhat/types";

import { runWithContinue, runWithoutContinue } from "./helper";

import { useEnvironment } from "../../helpers";

describe("typechain-truffle", () => {
  useEnvironment("typechain-truffle");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;
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
});

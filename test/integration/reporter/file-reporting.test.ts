import { expect } from "chai";
import { readdirSync } from "fs";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { runWithoutContinue } from "../migration/helper";

import { useEnvironment } from "../../helpers";
import { createAndInitReporter } from "../../../src/tools/reporters/Reporter";
import { resetTransactionRunner } from "../../../src/tools/runners/TransactionRunner";

describe("file-reporting", () => {
  useEnvironment("typechain-ethers");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetTransactionRunner();
    await createAndInitReporter(hre);
  });

  describe("simple report", () => {
    it("should generate MD report", async function () {
      await runWithoutContinue(hre, {} as any);

      const files = readdirSync(hre.config.paths.cache);
      expect(files.length).to.be.greaterThan(0);

      const mdFiles = files.filter((file) => file.endsWith(".md"));
      expect(mdFiles.length).to.be.greaterThan(0);
    });
  });
});

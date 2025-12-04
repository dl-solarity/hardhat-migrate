import { expect } from "chai";
import { readdirSync } from "fs";

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { runWithoutContinue } from "../migration/helper.js";

import { useEnvironment } from "../../helpers.js";
import { createAndInitReporter } from "../../../src/internal/tools/reporters/Reporter.js";
import { resetTransactionRunner } from "../../../src/internal/tools/runners/TransactionRunner.js";
import { createEthersProvider } from "../../../src/internal/tools/network/EthersProvider.js";

describe("file-reporting", () => {
  useEnvironment("typechain-ethers");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetTransactionRunner();
    await createAndInitReporter(hre);
    await createEthersProvider(hre);
  });

  describe("simple report", () => {
    it("should generate MD report", async function () {
      await runWithoutContinue(hre, {});

      const files = readdirSync(hre.config.paths.cache);
      expect(files.length).to.be.greaterThan(0);

      const mdFiles = files.filter((file) => file.endsWith(".md"));
      expect(mdFiles.length).to.be.greaterThan(0);
    });
  });
});

import { expect } from "chai";

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { PublicReporter } from "../../../src/internal/tools/reporters/PublicReporter.js";
import { createAndInitReporter } from "../../../src/internal/tools/reporters/Reporter.js";
import { resetTransactionRunner } from "../../../src/internal/tools/runners/TransactionRunner.js";

import { useEnvironment } from "../../helpers.js";

describe("Public Reporter", () => {
  useEnvironment("namespace");

  let hre: HardhatRuntimeEnvironment;

  beforeEach("setup", async function () {
    hre = this.hre;

    resetTransactionRunner();
    await createAndInitReporter(hre);
  });

  it("should report using MD table", async () => {
    const { log, logs } = captureLog();
    await PublicReporter.reportContractsMD(["Contract", "Address"]);
    console.log = log;

    expect(logs).to.have.length(2);
    expect(logs[1]).to.include(
      "| Contract | Address                    |\n" +
        "| -------- | -------------------------- |\n" +
        "| Contract | [Address](address/Address) |\n",
    );
  });

  function captureLog() {
    const log = console.log;
    const logs: string[] = [];
    console.log = (message: string) => {
      logs.push(message);
    };
    return { log, logs };
  }
});

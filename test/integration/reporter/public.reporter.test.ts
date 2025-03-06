import { expect } from "chai";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { PublicReporter } from "../../../src/tools/reporters/PublicReporter";
import { createAndInitReporter } from "../../../src/tools/reporters/Reporter";
import { resetTransactionRunner } from "../../../src/tools/runners/TransactionRunner";

import { useEnvironment } from "../../helpers";

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

    expect(logs).to.have.length(1);
    expect(logs[0]).to.include(
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

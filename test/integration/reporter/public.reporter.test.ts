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

  it.only("should shorten address by default", async () => {
    const { log, logs } = captureLog();
    await PublicReporter.reportContractsMD(["Contract", "Address"]);
    console.log = log;

    expect(logs).to.have.length(1);
    expect(logs[0]).to.include("| Contract | [Addres...ress](/address/Address) |");
  });

  it("should be able to set shorten address to false", async () => {
    const { log, logs } = captureLog();
    await PublicReporter.disableShortenAddress().reportContractsMD(["Contract", "Address"]);
    console.log = log;

    expect(logs).to.have.length(1);
    expect(logs[0]).to.include("| Contract | [Address](/address/Address) |");
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

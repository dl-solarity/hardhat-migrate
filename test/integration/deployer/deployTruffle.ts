import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { expect } from "chai";

import { useEnvironment } from "../../helpers";

import { Deployer } from "../../../src/deployer/Deployer";

import { TransactionStorage } from "../../../src/tools/storage/MigrateStorage";
import { Reporter } from "../../../src/tools/reporters/Reporter";

describe("Truffle -- deployer", () => {
  describe("deploy()", () => {
    useEnvironment("minimal-truffle");

    let contractWithConstructorArtifact: TruffleContract;
    let deployer: Deployer;

    beforeEach("setup", async function () {
      deployer = new Deployer(this.hre);

      Reporter.init(this.hre);
      TransactionStorage.clear();

      contractWithConstructorArtifact = await this.hre.artifacts.require("ContractWithConstructorArguments");
    });

    it("should deploy contract with constructor arguments", async function () {
      const contract: TruffleContract = await deployer.deploy(contractWithConstructorArtifact, ["test"], {});

      const name = await contract.name();

      expect(name).to.equal("test");
    });

    it("should revert if artifact is not a contract", async function () {
      await expect(deployer.deploy({} as any, [], {})).to.be.rejected;
    });
  });
});

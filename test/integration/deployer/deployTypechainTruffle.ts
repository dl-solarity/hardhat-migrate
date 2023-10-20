import { expect } from "chai";
import { ZeroAddress } from "ethers";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { useEnvironment } from "../../helpers";

import { Deployer } from "../../../src/deployer/Deployer";

import { TransactionStorage } from "../../../src/tools/storage/Storage";

describe("Truffle Typechain deployer", () => {
  describe("deploy()", () => {
    useEnvironment("minimal-typechain-truffle");

    let contractWithConstructorArtifact: TruffleContract;
    let ContractWithExternalLibraryArtifact: TruffleContract;
    let library1Artifact: TruffleContract;
    let library2Artifact: TruffleContract;
    let deployer: Deployer;

    beforeEach("setup", async function () {
      deployer = new Deployer(this.hre);

      TransactionStorage.clear();

      contractWithConstructorArtifact = await this.hre.artifacts.require("ContractWithConstructorArguments");
      ContractWithExternalLibraryArtifact = await this.hre.artifacts.require("ContractWithExternalLibrary");
      library1Artifact = await this.hre.artifacts.require("Library1");
      library2Artifact = await this.hre.artifacts.require("Library2");
    });

    it("should deploy contract with constructor arguments", async function () {
      const contract = await deployer.deploy(contractWithConstructorArtifact, ["test"], {});

      const name = await (contract as any).name();

      expect(name).to.equal("test");
    });

    it("should revert if artifact is not a contract", async function () {
      await expect(deployer.deploy(null as any, [], {})).to.be.rejected;
    });

    it("should deploy library separately", async function () {
      await expect(deployer.deploy(library1Artifact, [])).to.be.not.rejected;
    });

    it("should deploy contract with provided libraries", async function () {
      await expect(
        deployer.deploy(ContractWithExternalLibraryArtifact, [], {
          libraries: {
            "contracts/Contracts.sol:Library1": ZeroAddress,
            "contracts/Contracts.sol:Library2": ZeroAddress,
          },
        }),
      ).to.be.not.rejected;
    });

    it("should deploy contract with memorized libraries", async function () {
      await deployer.deploy(library1Artifact, []);
      await deployer.deploy(library2Artifact, []);

      await expect(deployer.deploy(ContractWithExternalLibraryArtifact, [], {})).to.be.not.rejected;
    });

    it("should deploy contract without memorized libraries", async function () {
      await expect(deployer.deploy(ContractWithExternalLibraryArtifact, [], {})).to.be.not.rejected;
    });
  });
});

import { expect } from "chai";
import { ZeroAddress } from "ethers";

import { useEnvironment } from "../../helpers";

import { Migrator } from "../../../src/migrator/Migrator";
import { Deployer } from "../../../src/deployer/Deployer";

import { TransactionStorage } from "../../../src/tools/storage/MigrateStorage";

import {
  ContractWithConstructorArguments__factory,
  ContractWithExternalLibrary__factory,
  Library1__factory,
  Library2__factory,
} from "../../fixture-projects/hardhat-project-minimal-typechain-ethers/typechain-types";

describe("Ehters Typechain -- Deployer", () => {
  describe("deploy()", () => {
    useEnvironment("minimal-typechain-ethers");

    let deployer: Deployer;

    beforeEach("setup", async function () {
      await Migrator.initialize(this.hre);

      deployer = new Deployer(this.hre);

      TransactionStorage.clear();
    });

    it("should deploy contract with constructor arguments", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["test"], {});

      const name = await contract.name();

      expect(name).to.equal("test");
    });

    it("should revert if artifact is not a contract", async function () {
      await expect(deployer.deploy(null as any, [], {})).to.be.rejected;
    });

    it("should deploy library separately", async function () {
      await expect(deployer.deploy(Library1__factory, [])).to.be.not.rejected;
    });

    it("should deploy contract with provided libraries", async function () {
      await expect(
        deployer.deploy(ContractWithExternalLibrary__factory, [], {
          libraries: {
            "contracts/Contracts.sol:Library1": ZeroAddress,
            "contracts/Contracts.sol:Library2": ZeroAddress,
          },
        }),
      ).to.be.not.rejected;
    });

    it("should deploy contract with memorized libraries", async function () {
      await deployer.deploy(Library1__factory, []);
      await deployer.deploy(Library2__factory, []);

      await expect(deployer.deploy(ContractWithExternalLibrary__factory, [], {})).to.be.not.rejected;
    });

    it("should deploy contract with libraries without libraries pre-deploy", async function () {
      await expect(deployer.deploy(ContractWithExternalLibrary__factory, [], {})).to.be.not.rejected;
    });
  });
});

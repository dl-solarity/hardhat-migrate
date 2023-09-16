import { expect } from "chai";

import { useEnvironment } from "../../helpers";

import { Deployer } from "../../../src/deployer/Deployer";
import { PluginName } from "../../../src/types/migrations";

import { TransactionStorage } from "../../../src/tools/storage/TransactionStorage";
import {
  ContractWithConstructorArguments__factory,
  ContractWithExternalLibrary__factory,
  Library1__factory,
} from "../../fixture-projects/hardhat-project-minimal-typechain-ethers/typechain-types";

describe("deployer", () => {
  describe("deploy()", () => {
    useEnvironment("minimal-typechain-ethers");

    let deployer: Deployer;

    beforeEach("setup", async function () {
      await this.hre.run("compile", { quiet: true });

      deployer = new Deployer(this.hre, PluginName.ETHERS);

      TransactionStorage.getInstance().init(this.hre);
      TransactionStorage.getInstance().clear();
    });

    it("should deploy contract with constructor arguments", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["test"], {});

      const name = await contract.name();

      expect(name).to.equal("test");
    });

    it("should revert if artifact is not a contract", async function () {
      await expect(deployer.deploy(null as any, [], {})).to.eventually.be.rejected;
    });

    it("should deploy library separately", async function () {
      await expect(deployer.deploy(Library1__factory, [])).to.eventually.be.not.rejected;
    });

    it("should deploy contract with library", async function () {
      // const library = await deployer.deploy(Library__factory, []);
      // const contract = await deployer.deploy(ContractWithExternalLibrary__factory, []);
      // this.hre.ethers.getContractFactory("ContractWithExternalLibrary");
      // const value = await contract.lib();
      // expect(value).to.equal(1);
    });
  });
});

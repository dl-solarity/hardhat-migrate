import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";

import { useEnvironment } from "../../helpers";

import { Deployer } from "../../../src/deployer/Deployer";
import { TransactionStorage } from "../../../src/tools/storage/MigrateStorage";
import { Reporter } from "../../../src/tools/reporters/Reporter";
import { Provider } from "../../../src/tools/Provider";
import {
  ContractWithConstructorArguments__factory,
  ContractWithPayableConstructor__factory,
} from "../../fixture-projects/hardhat-project-minimal-typechain-ethers/typechain-types";
import { Migrator } from "../../../src/migrator/Migrator";

describe("deployer", () => {
  describe("deploy()", () => {
    useEnvironment("minimal-ethers");

    beforeEach(async function () {
      await Provider.init(this.hre);
      await Reporter.init(this.hre.config.migrate);
    });

    let deployer: Deployer;
    let ContractWithConstructor: ContractFactory<any[], Contract>;
    let ContractWithPayableConstructor: ContractFactory<any[], Contract>;

    beforeEach("setup", async function () {
      deployer = new Deployer(this.hre);

      TransactionStorage.clear();

      ContractWithConstructor = <ContractFactory<any[], Contract>>(
        (<unknown>new ContractWithConstructorArguments__factory())
      );
      ContractWithPayableConstructor = <ContractFactory<any[], Contract>>(
        (<unknown>new ContractWithPayableConstructor__factory())
      );
    });

    it("should deploy contract with constructor arguments", async function () {
      const contract = await deployer.deploy(ContractWithConstructor, ["test"], {});

      const name = await contract.name();

      expect(name).to.equal("test");
    });

    it("should deploy contract with ethers", async function () {
      const value = BigInt(1);

      const contract = await deployer.deploy(ContractWithPayableConstructor, [], { value: value });

      expect(await Provider.provider.getBalance(contract.getAddress())).to.equal(value);
    });

    it("should revert if artifact is not a contract", async function () {
      await expect(deployer.deploy({} as any, [], {})).to.be.rejected;
    });
  });
});

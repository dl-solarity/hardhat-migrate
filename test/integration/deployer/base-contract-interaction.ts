import { expect } from "chai";

import { useEnvironment } from "../../helpers";

import {
  ConstructorWithArguments__factory,
  PayableConstructor__factory,
} from "../../fixture-projects/hardhat-project-typechain-ethers/typechain-types";

import { Deployer } from "../../../src/deployer/Deployer";
import { Migrator } from "../../../src/migrator/Migrator";

import { ethersProvider } from "../../../src/tools/network/EthersProvider";
import { TransactionStorage } from "../../../src/tools/storage/MigrateStorage";

describe("deployer", () => {
  let deployer: Deployer;

  describe("default interaction with contracts", () => {
    useEnvironment("typechain-ethers");

    beforeEach("setup", async function () {
      await Migrator.buildMigrateTaskDeps(this.hre);

      deployer = new Deployer(this.hre);

      TransactionStorage.clear();
    });

    it("should deploy contract with constructor arguments", async function () {
      const contract = await deployer.deploy(ConstructorWithArguments__factory, [1], {});

      expect(await contract.value()).to.equal(1n);
    });

    it("should deploy contract with ethers", async function () {
      const toPay = 100n;

      const contract = await deployer.deploy(PayableConstructor__factory, [], { value: toPay });

      expect(await ethersProvider!.provider.getBalance(contract.getAddress())).to.equal(toPay);
    });

    it("should revert if artifact is not a contract", async function () {
      await expect(deployer.deploy({} as any, [], {})).to.be.rejectedWith(
        "Deployer.deploy(): Unknown Contract Factory Type",
      );
    });
  });
});

import { expect } from "chai";
import { ethers } from "ethers";

import { useEnvironment } from "../../helpers.js";

import {
  ConstructorWithArguments,
  ConstructorWithArguments__factory,
  IConstructorWithArguments__factory,
} from "../../fixture-projects/hardhat-project-typechain-ethers/typechain-types/index.js";

import { Deployer } from "../../../src/internal/deployer/Deployer.js";
import { Migrator } from "../../../src/internal/migrator/Migrator.js";

import { ethersProvider } from "../../../src/internal/tools/network/EthersProvider.js";
import { TransactionStorage } from "../../../src/internal/tools/storage/MigrateStorage.js";

describe("deployer", () => {
  let deployer: Deployer;

  describe("default interaction with contracts", () => {
    useEnvironment("typechain-ethers");

    let contract: ConstructorWithArguments;

    beforeEach("setup", async function () {
      await Migrator.buildMigrateTaskDeps(this.hre);

      deployer = new Deployer();

      const ContractFactory = new ConstructorWithArguments__factory(await ethersProvider!.getSigner());
      contract = await ContractFactory.deploy(2);

      TransactionStorage.clear();
    });

    it("should save and recover contract by name", async function () {
      const contractName = "ConstructorWithArguments";

      await deployer.save(contractName, await contract.getAddress());

      const contractInstance = await deployer.deployed(ConstructorWithArguments__factory, contractName);

      expect(await contractInstance.getAddress()).to.equal(await contract.getAddress());
    });

    it("should save and recover contract by instance", async function () {
      await deployer.save(ConstructorWithArguments__factory, await contract.getAddress());

      const contractInstance = await deployer.deployed(ConstructorWithArguments__factory);

      expect(await contractInstance.getAddress()).to.equal(await contract.getAddress());
    });

    it("should recover contract using interface", async function () {
      await deployer.save(ConstructorWithArguments__factory, await contract.getAddress());

      const contractInstance = await deployer.deployed(IConstructorWithArguments__factory, await contract.getAddress());

      expect(await contractInstance.getAddress()).to.equal(await contract.getAddress());
    });

    it("should throw error if contract is not deployed", async function () {
      await expect(deployer.save(ConstructorWithArguments__factory, ethers.ZeroAddress)).to.be.rejectedWith(
        "Deployer.save(): Contract with address '0x0000000000000000000000000000000000000000' is not deployed",
      );
    });
  });
});

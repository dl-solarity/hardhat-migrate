import { HardhatRuntimeEnvironment } from "hardhat/types";

import { expect } from "chai";

import { useEnvironment } from "../../helpers";

import {
  ConstructorWithArguments__factory,
  PayableConstructor__factory,
  PayableReceive__factory,
} from "../../fixture-projects/hardhat-project-typechain-ethers/typechain-types";

import { Deployer } from "../../../src/deployer/Deployer";
import { Migrator } from "../../../src/migrator/Migrator";

import { Reporter } from "../../../src/tools/reporters/Reporter";
import { ethersProvider } from "../../../src/tools/network/EthersProvider";
import { TransactionStorage } from "../../../src/tools/storage/MigrateStorage";

describe("deployer", () => {
  let deployer: Deployer;

  describe("default interaction with contracts (Ethers)", () => {
    useEnvironment("typechain-ethers");

    let hre: HardhatRuntimeEnvironment;

    beforeEach("setup", async function () {
      await Migrator.buildMigrateTaskDeps(this.hre);

      deployer = new Deployer(this.hre);

      hre = this.hre;

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

    it("should not deploy contract with invalid constructor arguments", async function () {
      const signer = (await deployer.getSigner()) as any;

      await expect(deployer.deploy(ConstructorWithArguments__factory, [signer], {})).to.be.rejectedWith(
        `Deployer.deploy(): MinimalContract.deploy(): MinimalContract._createDeployTransaction(): invalid BigNumberish value (argument="value", value="<SignerWithAddress 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266>", code=INVALID_ARGUMENT, version=6.11.1)`,
      );
    });

    it("should revert if artifact is not a contract", async function () {
      await expect(deployer.deploy({} as any, [], {})).to.be.rejectedWith(
        "Deployer.deploy(): Unknown Contract Factory Type",
      );
    });

    it("should be able to customize overrides for function calls", async function () {
      const contract = await deployer.deploy(PayableReceive__factory);

      const toPay = 100n;

      await contract.pay({ value: toPay.toString() });

      expect(await ethersProvider!.provider.getBalance(contract.getAddress())).to.equal(toPay);
    });

    it("should connect to different signer and send transaction", async function () {
      const [signer1, signer2] = await hre.ethers.getSigners();

      const contract = await deployer.deploy(PayableReceive__factory);

      let tx = await contract.pay({ value: 100n });
      let receipt = await tx.wait();

      expect(receipt!.from).to.equal(signer1.address);

      tx = await contract.connect(signer2).pay({ value: 100n });
      receipt = await tx.wait();

      expect(receipt!.from).to.equal(signer2.address);
      expect(Reporter?.getWarningsCount()).to.be.equal(0);
    });
  });
});

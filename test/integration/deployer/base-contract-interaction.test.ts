import { expect } from "chai";

import { useEnvironment } from "../../helpers.js";

import {
  ConstructorWithArguments__factory,
  PayableConstructor__factory,
  PayableReceive__factory,
} from "../../fixture-projects/hardhat-project-typechain-ethers/typechain-types/index.js";

import { Deployer } from "../../../src/internal/deployer/Deployer.js";
import { Migrator } from "../../../src/internal/migrator/Migrator.js";

import { Reporter } from "../../../src/internal/tools/reporters/Reporter.js";
import { ethersProvider } from "../../../src/internal/tools/network/EthersProvider.js";
import { TransactionStorage } from "../../../src/internal/tools/storage/MigrateStorage.js";

describe("deployer", () => {
  let deployer: Deployer;

  describe("default interaction with contracts (Ethers)", () => {
    useEnvironment("typechain-ethers");

    beforeEach("setup", async function () {
      await Migrator.buildMigrateTaskDeps(this.hre);

      deployer = new Deployer();

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
        `invalid BigNumberish value`,
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

    it("should deploy ERC1967 proxy contract and set implementation", async function () {
      const contract = await deployer.deployERC1967Proxy(
        PayableReceive__factory,
        PayableReceive__factory.createInterface().encodeFunctionData("pay"),
      );

      const toPay = 100n;

      await contract.pay({ value: toPay.toString() });

      expect(await ethersProvider!.provider.getBalance(contract.getAddress())).to.equal(toPay);
    });

    it("should deploy TransparentUpgradeableProxy contract and set implementation", async function () {
      const contract = await deployer.deployTransparentUpgradeableProxy(
        PayableReceive__factory,
        await (await deployer.getSigner()).getAddress(),
        "0x",
      );

      const toPay = 100n;

      await contract.pay({ value: toPay.toString() });

      expect(await ethersProvider!.provider.getBalance(contract.getAddress())).to.equal(toPay);
    });

    it("should deploy generic proxy contract", async function () {
      const contract = await deployer.deployProxy(PayableReceive__factory, "ERC1967Proxy", (implementationAddress) => [
        implementationAddress,
        "0x",
      ]);

      const toPay = 100n;

      await contract.pay({ value: toPay.toString() });

      expect(await ethersProvider!.provider.getBalance(contract.getAddress())).to.equal(toPay);
    });

    it("should connect to different signer and send transaction", async function () {
      const [signer1, signer2] = await ethersProvider!.getSigners();

      const contract = await deployer.deploy(PayableReceive__factory);

      let tx = await contract.pay({ value: 100n });
      let receipt = await tx.wait();

      expect(receipt!.from).to.equal(signer1.address);

      tx = await contract.connect(signer2).pay({ value: 100n });
      receipt = await tx.wait();

      expect(receipt!.from).to.equal(signer2.address);
      expect(Reporter?.getWarningsCount()).to.be.equal(6);
    });
  });
});

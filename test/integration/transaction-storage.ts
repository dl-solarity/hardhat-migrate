import { assert, expect } from "chai";
import { ContractFactory, ZeroAddress } from "ethers";

import { useEnvironment } from "../helpers";

import { Deployer } from "../../src/deployer/Deployer";
import { ArtifactProcessor } from "../../src/tools/storage/ArtifactProcessor";
import { TransactionStorage } from "../../src/tools/storage/MigrateStorage";
import { TransactionProcessor } from "../../src/tools/storage/TransactionProcessor";

import {
  ContractWithConstructorArguments__factory,
  ContractWithPayableConstructor__factory,
} from "../fixture-projects/hardhat-project-repeats-typechain-ethers/typechain-types";
import { Reporter } from "../../src/tools/reporters/Reporter";
import { Provider } from "../../src/tools/Provider";

describe("TransactionStorage", async () => {
  useEnvironment("repeats-typechain-ethers");

  beforeEach(async function () {
    await Provider.init(this.hre);
    Reporter.init(this.hre.config.migrate);

    await ArtifactProcessor.parseArtifacts(this.hre);
  });

  afterEach(async function () {
    TransactionStorage.clear();
  });

  describe("saveDeploymentTransaction() via Deployer", function () {
    let deployer: Deployer;

    beforeEach(function () {
      deployer = new Deployer(this.hre);
    });

    it("should save deployment transaction", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", {
        from: await (await deployer.getSigner()).getAddress(),
        chainId: await deployer.getChainId(),
        value: 0,
      });

      assert.equal(await TransactionProcessor.tryRestoreContractAddressByKeyFields(tx), await contract.getAddress());
    });

    it("should save deployment transaction by name", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      assert.equal(
        await TransactionProcessor.tryRestoreContractAddressByName(
          "contracts/another-contracts/Contracts.sol:ContractWithConstructorArguments",
        ),
        await contract.getAddress(),
      );
    });

    it("should save deployment transaction with transmitted ether", async function () {
      const value = BigInt(1);

      const contract = await deployer.deploy(ContractWithPayableConstructor__factory, [], { value: value });
      const factory = new ContractFactory(
        ContractWithPayableConstructor__factory.abi,
        ContractWithPayableConstructor__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction({
        value: value,
        from: await (await deployer.getSigner()).getAddress(),
        chainId: await deployer.getChainId(),
      });

      assert.equal(await TransactionProcessor.tryRestoreContractAddressByKeyFields(tx), await contract.getAddress());
    });

    it("should differ contracts with chainId", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const data = await factory.getDeployTransaction("hello", {
        chainId: 1,
        from: await (await deployer.getSigner()).getAddress(),
        value: 0,
      });

      await expect(TransactionProcessor.tryRestoreContractAddressByKeyFields(data)).to.be.rejectedWith(
        "tryRestoreContractAddressByKeyFields(): Requested data not found in storage",
      );
    });

    it("should differ contracts with from", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", {
        from: ZeroAddress,
        chainId: await deployer.getChainId(),
        value: 0,
      });

      await expect(TransactionProcessor.tryRestoreContractAddressByKeyFields(tx)).to.be.rejectedWith(
        "tryRestoreContractAddressByKeyFields(): Requested data not found in storage",
      );
    });

    it("should not differ contracts with nonce", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const data = await factory.getDeployTransaction("hello", {
        nonce: 0,
        from: await (await deployer.getSigner()).getAddress(),
        chainId: await deployer.getChainId(),
        value: 0,
      });

      assert.equal(await TransactionProcessor.tryRestoreContractAddressByKeyFields(data), await contract.getAddress());
    });

    it("should differ contracts with args", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const data = await factory.getDeployTransaction("hello2", {
        from: await (await deployer.getSigner()).getAddress(),
        chainId: await deployer.getChainId(),
        value: 0,
      });

      await expect(TransactionProcessor.tryRestoreContractAddressByKeyFields(data)).to.be.rejectedWith(
        "tryRestoreContractAddressByKeyFields(): Requested data not found in storage",
      );
    });
  });
});

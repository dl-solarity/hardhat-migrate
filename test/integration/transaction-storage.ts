import { assert, expect } from "chai";
import { ContractFactory, ZeroAddress } from "ethers";

import { Deployer } from "../../src/deployer/Deployer";
import { ArtifactProcessor } from "../../src/tools/storage/ArtifactProcessor";
import { TransactionStorage } from "../../src/tools/storage/Storage";
import { TransactionProcessor } from "../../src/tools/storage/TransactionProcessor";
import {
  ContractWithConstructorArguments__factory,
  ContractWithPayableConstructor__factory,
} from "../fixture-projects/hardhat-project-repeats-typechain-ethers/typechain-types";
import { useEnvironment } from "../helpers";

describe("TransactionStorage", async () => {
  useEnvironment("repeats-typechain-ethers");

  beforeEach(async function () {
    await ArtifactProcessor.parseArtifacts(this.hre);
  });

  afterEach(async function () {
    TransactionStorage.clear();
  });

  describe("saveDeploymentTransaction()", () => {
    it("should save deployment transaction", function () {
      const tx = { data: "", chainId: BigInt(0), from: "" };

      TransactionProcessor.saveDeploymentTransaction(tx, "name", "123");

      assert.equal(TransactionProcessor.restoreSavedDeployTransaction(tx), "123");
    });

    it("should save deployment transaction by name", function () {
      const tx = { data: "", chainId: BigInt(0), from: "" };

      const contractName = "Bla";

      const contractAddress = "123";

      TransactionProcessor.saveDeploymentTransaction(tx, contractName, contractAddress);

      assert(TransactionProcessor.restoreSavedDeployTransaction(contractName), contractAddress);
    });
  });

  describe("via Deployer", function () {
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

      const tx = await factory.getDeployTransaction("hello");

      assert.equal(TransactionProcessor.restoreSavedDeployTransaction(tx), await contract.getAddress());
    });

    it("should save deployment transaction by name", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      assert.equal(
        TransactionProcessor.restoreSavedDeployTransaction(
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

      const tx = await factory.getDeployTransaction({ value: value });

      assert.equal(TransactionProcessor.restoreSavedDeployTransaction(tx), await contract.getAddress());
    });

    it("should differ contracts with chainId", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { chainId: 1 });

      expect(() => TransactionProcessor.restoreSavedDeployTransaction(tx)).to.throw("Transaction not found in storage");
    });

    it("should differ contracts with chainId", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { chainId: 1 });

      expect(() => TransactionProcessor.restoreSavedDeployTransaction(tx)).to.throw("Transaction not found in storage");
    });

    it("should differ contracts with from", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { from: ZeroAddress });

      expect(() => TransactionProcessor.restoreSavedDeployTransaction(tx)).to.throw("Transaction not found in storage");
    });

    it("should not differ contracts with nonce", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { nonce: 0 });

      assert.equal(TransactionProcessor.restoreSavedDeployTransaction(tx), await contract.getAddress());
    });

    it("should differ contracts with args", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello2");

      expect(() => TransactionProcessor.restoreSavedDeployTransaction(tx)).to.throw("Transaction not found in storage");
    });
  });
});

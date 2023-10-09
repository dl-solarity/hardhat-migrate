import { assert, expect } from "chai";
import { ContractFactory, ZeroAddress } from "ethers";

import { Deployer } from "../../src/deployer/Deployer";
import { ArtifactParser } from "../../src/deployer/ArtifactParser";
import { TransactionProcessor } from "../../src/tools/storage/TransactionProcessor";
import {
  ContractWithConstructorArguments__factory,
  ContractWithPayableConstructor__factory,
} from "../fixture-projects/hardhat-project-repeats-typechain-ethers/typechain-types";
import { useEnvironment } from "../helpers";

describe("TransactionStorage", async () => {
  let transactionStorage: TransactionProcessor;

  useEnvironment("repeats-typechain-ethers");

  beforeEach(async function () {
    transactionStorage = TransactionProcessor.getInstance();

    transactionStorage.init(this.hre);

    await ArtifactParser.parseArtifacts(this.hre);
  });

  afterEach(async function () {
    transactionStorage.clear();
  });

  describe("saveDeploymentTransaction()", () => {
    it("should save deployment transaction", function () {
      const tx = { data: "", chainId: BigInt(0), from: "" };

      transactionStorage.saveDeploymentTransaction(tx, "name", "123");

      assert.equal(transactionStorage.getDeploymentTransaction(tx), "123");
    });

    it("should save deployment transaction by name", function () {
      const tx = { data: "", chainId: BigInt(0), from: "" };

      const contractName = "Bla";

      const contractAddress = "123";

      transactionStorage.saveDeploymentTransaction(tx, contractName, contractAddress);

      assert(transactionStorage.getDeploymentTransactionByName(contractName), contractAddress);
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

      assert.equal(transactionStorage.getDeploymentTransaction(tx), await contract.getAddress());
    });

    it("should save deployment transaction by name", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      assert.equal(
        transactionStorage.getDeploymentTransactionByName(
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

      assert.equal(transactionStorage.getDeploymentTransaction(tx), await contract.getAddress());
    });

    it("should differ contracts with chainId", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { chainId: 1 });

      expect(() => transactionStorage.getDeploymentTransaction(tx)).to.throw("Transaction not found in storage");
    });

    it("should differ contracts with chainId", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { chainId: 1 });

      expect(() => transactionStorage.getDeploymentTransaction(tx)).to.throw("Transaction not found in storage");
    });

    it("should differ contracts with from", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { from: ZeroAddress });

      expect(() => transactionStorage.getDeploymentTransaction(tx)).to.throw("Transaction not found in storage");
    });

    it("should not differ contracts with nonce", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { nonce: 0 });

      assert.equal(transactionStorage.getDeploymentTransaction(tx), await contract.getAddress());
    });

    it("should differ contracts with args", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello2");

      expect(() => transactionStorage.getDeploymentTransaction(tx)).to.throw("Transaction not found in storage");
    });
  });
});

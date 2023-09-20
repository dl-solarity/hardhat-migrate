import { assert } from "chai";
import { ContractFactory, ZeroAddress } from "ethers";

import { Deployer } from "../../src/deployer/Deployer";
import { ArtifactsParser } from "../../src/parser/ArtifactsParser";
import { TransactionStorage } from "../../src/tools/storage/TransactionStorage";
import { PluginName } from "../../src/types/migrations";
import {
  ContractWithConstructorArguments__factory,
  ContractWithPayableConstructor__factory,
} from "../fixture-projects/hardhat-project-minimal-typechain-ethers/typechain-types";
import { useEnvironment } from "../helpers";

describe("TransactionStorage", async () => {
  let transactionStorage: TransactionStorage;

  useEnvironment("repeats-typechain-ethers");

  beforeEach(async function () {
    transactionStorage = TransactionStorage.getInstance();

    transactionStorage.init(this.hre);

    await new ArtifactsParser(this.hre).parseArtifacts();
  });

  afterEach(async function () {
    transactionStorage.clear();
  });

  describe("saveDeploymentTransaction()", () => {
    it("should save deployment transaction", function () {
      const tx = { data: "", chainId: BigInt(0), from: "" };

      transactionStorage.saveDeploymentTransaction(tx, "123");

      assert.equal(transactionStorage.getDeploymentTransaction(tx), "123");
    });
  });

  describe("saveDeploymentTransactionByName()", () => {
    it("should save deployment transaction by name", function () {
      const contractName = "Bla";

      const contractAddress = "123";

      transactionStorage.saveDeploymentTransactionByName(contractName, contractAddress);

      assert(transactionStorage.getDeploymentTransactionByName(contractName), contractAddress);
    });
  });

  describe("via Deployer", function () {
    let deployer: Deployer;

    before(function () {
      deployer = new Deployer(this.hre, PluginName.ETHERS);
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
        transactionStorage.getDeploymentTransactionByName("contracts/Contracts.sol:ContractWithConstructorArguments"),
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

      assert.equal(transactionStorage.getDeploymentTransaction(tx), undefined);
    });

    it("should differ contracts with chainId", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { chainId: 1 });

      assert.equal(transactionStorage.getDeploymentTransaction(tx), undefined);
    });

    it("should differ contracts with from", async function () {
      await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      const factory = new ContractFactory(
        ContractWithConstructorArguments__factory.abi,
        ContractWithConstructorArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction("hello", { from: ZeroAddress });

      assert.equal(transactionStorage.getDeploymentTransaction(tx), undefined);
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

      assert.equal(transactionStorage.getDeploymentTransaction(tx), undefined);
    });
  });
});

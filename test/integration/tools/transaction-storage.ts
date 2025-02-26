import { assert, expect } from "chai";

import { ContractFactory, ZeroAddress } from "ethers";

import { useEnvironment } from "../../helpers";

import {
  PayableConstructor__factory,
  ConstructorWithArguments__factory,
} from "../../fixture-projects/hardhat-project-typechain-ethers/typechain-types";

import { Deployer } from "../../../src/deployer/Deployer";
import { Migrator } from "../../../src/migrator/Migrator";

import { UNKNOWN_CONTRACT_NAME } from "../../../src/constants";
import { ContractDeployTxWithName } from "../../../src/types/deployer";

import { TransactionStorage } from "../../../src/tools/storage/MigrateStorage";
import { TransactionProcessor } from "../../../src/tools/storage/TransactionProcessor";

describe("TransactionStorage", async () => {
  useEnvironment("typechain-ethers");

  beforeEach(async function () {
    await Migrator.buildMigrateTaskDeps(this.hre);
  });

  afterEach(async function () {
    TransactionStorage.clear();
  });

  describe("transaction saving process in the storage", function () {
    let deployer: Deployer;

    beforeEach(function () {
      deployer = new Deployer(this.hre);
    });

    it("should save deployment transaction", async function () {
      const contract = await deployer.deploy(PayableConstructor__factory, [], {
        name: UNKNOWN_CONTRACT_NAME,
      });

      const factory = new ContractFactory(PayableConstructor__factory.abi, PayableConstructor__factory.bytecode);

      const tx = await factory.getDeployTransaction({
        from: await (await deployer.getSigner()).getAddress(),
        chainId: await deployer.getChainId(),
        value: 0,
      });

      const keyFields: ContractDeployTxWithName = {
        ...tx,
        contractName: UNKNOWN_CONTRACT_NAME,
      };

      assert.equal(
        await TransactionProcessor?.tryRestoreContractAddressByKeyFields(keyFields),
        await contract.getAddress(),
      );
    });

    it("should save deployment transaction by name", async function () {
      const contract = await deployer.deploy(PayableConstructor__factory, []);

      assert.equal(
        await TransactionProcessor?.tryRestoreContractAddressByName("contracts/TestContracts.sol:PayableConstructor"),
        await contract.getAddress(),
      );
    });

    it("should save deployment transaction with transmitted ether", async function () {
      const value = BigInt(1);

      const contract = await deployer.deploy(PayableConstructor__factory, [], {
        value: value,
        name: UNKNOWN_CONTRACT_NAME,
      });
      const factory = new ContractFactory(PayableConstructor__factory.abi, PayableConstructor__factory.bytecode);

      const tx = await factory.getDeployTransaction({
        value: value,
        from: await (await deployer.getSigner()).getAddress(),
        chainId: await deployer.getChainId(),
      });

      const keyFields: ContractDeployTxWithName = {
        ...tx,
        contractName: UNKNOWN_CONTRACT_NAME,
      };

      assert.equal(
        await TransactionProcessor?.tryRestoreContractAddressByKeyFields(keyFields),
        await contract.getAddress(),
      );
    });

    it("should differ contracts with chainId", async function () {
      await deployer.deploy(ConstructorWithArguments__factory, [100n]);

      const factory = new ContractFactory(
        ConstructorWithArguments__factory.abi,
        ConstructorWithArguments__factory.bytecode,
      );

      const data = await factory.getDeployTransaction(100n, {
        chainId: 1,
        from: await (await deployer.getSigner()).getAddress(),
        value: 0,
      });

      const keyFields: ContractDeployTxWithName = {
        ...data,
        contractName: UNKNOWN_CONTRACT_NAME,
      };

      await expect(TransactionProcessor?.tryRestoreContractAddressByKeyFields(keyFields)).to.be.rejectedWith(
        "BaseTransactionProcessor.tryRestoreContractAddressByKeyFields(): BaseTransactionProcessor._tryGetDataFromStorage(): Requested data not found in storage",
      );
    });

    it("should differ contracts with from", async function () {
      await deployer.deploy(ConstructorWithArguments__factory, [100n]);

      const factory = new ContractFactory(
        ConstructorWithArguments__factory.abi,
        ConstructorWithArguments__factory.bytecode,
      );

      const tx = await factory.getDeployTransaction(100n, {
        from: ZeroAddress,
        chainId: await deployer.getChainId(),
        value: 0,
      });

      const keyFields: ContractDeployTxWithName = {
        ...tx,
        contractName: UNKNOWN_CONTRACT_NAME,
      };

      await expect(TransactionProcessor?.tryRestoreContractAddressByKeyFields(keyFields)).to.be.rejectedWith(
        "BaseTransactionProcessor.tryRestoreContractAddressByKeyFields(): BaseTransactionProcessor._tryGetDataFromStorage(): Requested data not found in storage",
      );
    });

    it("should not differ contracts with nonce", async function () {
      const contract = await deployer.deploy(ConstructorWithArguments__factory, [100n], {
        name: UNKNOWN_CONTRACT_NAME,
      });

      const factory = new ContractFactory(
        ConstructorWithArguments__factory.abi,
        ConstructorWithArguments__factory.bytecode,
      );

      const data = await factory.getDeployTransaction(100n, {
        nonce: 0,
        from: await (await deployer.getSigner()).getAddress(),
        chainId: await deployer.getChainId(),
        value: 0,
      });

      const keyFields: ContractDeployTxWithName = {
        ...data,
        contractName: UNKNOWN_CONTRACT_NAME,
      };

      assert.equal(
        await TransactionProcessor?.tryRestoreContractAddressByKeyFields(keyFields),
        await contract.getAddress(),
      );
    });

    it("should differ contracts with args", async function () {
      await deployer.deploy(ConstructorWithArguments__factory, [100n]);

      const factory = new ContractFactory(
        ConstructorWithArguments__factory.abi,
        ConstructorWithArguments__factory.bytecode,
      );

      const data = await factory.getDeployTransaction(200n, {
        from: await (await deployer.getSigner()).getAddress(),
        chainId: await deployer.getChainId(),
        value: 0,
      });

      const keyFields: ContractDeployTxWithName = {
        ...data,
        contractName: UNKNOWN_CONTRACT_NAME,
      };

      await expect(TransactionProcessor?.tryRestoreContractAddressByKeyFields(keyFields)).to.be.rejectedWith(
        "BaseTransactionProcessor.tryRestoreContractAddressByKeyFields(): BaseTransactionProcessor._tryGetDataFromStorage(): Requested data not found in storage",
      );
    });
  });
});

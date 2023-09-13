import { Overrides } from "ethers";

import { assert } from "chai";

import { EthersAdapter } from "../../src/deployer/adapters/EthersAdapter";
import { Deployer } from "../../src/deployer/Deployer";
import { TransactionStorage } from "../../src/tools/storage/TransactionStorage";
import { Args, ContractDeployParams } from "../../src/types/deployer";
import { PluginName } from "../../src/types/migrations";
import { ContractWithConstructorArguments__factory } from "../fixture-projects/hardhat-project-repeats-typechain-ethers/typechain-types/factories/Contracts.sol/ContractWithConstructorArguments__factory";
import { useEnvironment } from "../helpers";

describe("TransactionStorage", async () => {
  let transactionStorage: TransactionStorage;

  useEnvironment("repeats-typechain-ethers");

  beforeEach(async function () {
    await this.hre.run("compile", { quiet: true });

    transactionStorage = TransactionStorage.getInstance();

    transactionStorage.init(this.hre);
  });

  afterEach(async function () {
    transactionStorage.clear();
  });

  describe("saveDeploymentTransaction()", () => {
    let ethersAdapter: EthersAdapter;
    let deployParams: ContractDeployParams;

    beforeEach(async function () {
      ethersAdapter = new EthersAdapter(this.hre);

      deployParams = ethersAdapter.getContractDeployParams(ContractWithConstructorArguments__factory);
    });
    it("should save deployment transaction", function () {
      const args: Args = ["hello"];

      const txOverrides: Overrides = {};

      transactionStorage.saveDeploymentTransaction(deployParams, args, txOverrides, "123");

      assert.equal(transactionStorage.getDeploymentTransaction(deployParams, args, txOverrides), "123");
    });

    it("should NOT save the similar deployment transaction with simple hash", function () {
      const args: Args = ["hello"];

      const txOverrides: Overrides = {};
      const txOverrides2: Overrides = { value: 0 };

      transactionStorage.saveDeploymentTransaction(deployParams, args, txOverrides, "123");

      assert.equal(transactionStorage.getDeploymentTransaction(deployParams, args, txOverrides), "123");

      assert.equal(transactionStorage.getDeploymentTransaction(deployParams, args, txOverrides2), undefined);
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

  describe("via Deployer", async function () {
    let deployer: Deployer;
    let ethersAdapter: EthersAdapter;

    before(async function () {
      deployer = new Deployer(this.hre, PluginName.ETHERS);

      ethersAdapter = new EthersAdapter(this.hre);
    });

    it("should save deployment transaction", async function () {
      const contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"]);

      assert.equal(
        transactionStorage.getDeploymentTransaction(
          ethersAdapter.getContractDeployParams(ContractWithConstructorArguments__factory),
          ["hello"],
          {},
        ),
        await contract.getAddress(),
      );

      assert.equal(
        transactionStorage.getDeploymentTransactionByName("ContractWithConstructorArguments"),
        await contract.getAddress(),
      );
    });
  });
});

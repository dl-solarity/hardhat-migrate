import { assert } from "chai";
import { BrowserProvider, Contract, TransactionReceipt } from "ethers";
import { Artifact } from "hardhat/types";
import { Deployer } from "../../src/deployer/Deployer";
import { useEnvironment } from "../helpers";

describe("deployer", () => {
  let contractArtifact: Artifact;
  let contractWithPayableConstructorArtifact: Artifact;
  let contractWithConstructorArgumentsArtifact: Artifact;
  let deployer: Deployer;
  let from: string;

  useEnvironment("minimal");

  beforeEach("Loading hardhat environment", async function () {
    await this.hre.run("compile", { quiet: true });

    contractArtifact = await this.hre.artifacts.readArtifact("Contract");
    contractWithPayableConstructorArtifact = await this.hre.artifacts.readArtifact("ContractWithPayableConstructor");
    contractWithConstructorArgumentsArtifact = await this.hre.artifacts.readArtifact(
      "ContractWithConstructorArguments"
    );

    deployer = new Deployer(this.hre.network.provider);

    const accounts = (await this.hre.network.provider.request({
      method: "eth_accounts",
    })) as string[];

    from = accounts[0];
  });

  it("should deploy contract", async function () {
    const tx = await deployer.createDeployTransaction(
      contractArtifact.abi,
      contractArtifact.bytecode,
      [],
      BigInt(0),
      from
    );

    const hash = await deployer.sendTransaction(tx, from);

    const receipt: TransactionReceipt = await this.hre.network.provider.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    });

    assert.equal(receipt.status, 1);
  });

  it("should deploy contract with value", async function () {
    const tx = await deployer.createDeployTransaction(
      contractWithPayableConstructorArtifact.abi,
      contractWithPayableConstructorArtifact.bytecode,
      [],
      BigInt(1),
      from
    );

    const hash = await deployer.sendTransaction(tx, from);

    const receipt: TransactionReceipt = await this.hre.network.provider.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    });

    assert.equal(receipt.status, 1);

    const balance = await this.hre.network.provider.request({
      method: "eth_getBalance",
      params: [receipt.contractAddress],
    });

    assert.equal(balance, BigInt(1));
  });

  it("should deploy contract with constructor arguments", async function () {
    const tx = await deployer.createDeployTransaction(
      contractWithConstructorArgumentsArtifact.abi,
      contractWithConstructorArgumentsArtifact.bytecode,
      ["Hello, world!"],
      BigInt(0),
      from
    );

    const hash = await deployer.sendTransaction(tx, from);

    const receipt: TransactionReceipt = await this.hre.network.provider.request({
      method: "eth_getTransactionReceipt",
      params: [hash],
    });

    assert.equal(receipt.status, 1);

    const contract = new Contract(
      receipt.contractAddress!!,
      contractWithConstructorArgumentsArtifact.abi,
      await new BrowserProvider(this.hre.network.provider).getSigner(from)
    );

    const name = await contract.name();

    assert.equal(name, "Hello, world!");
  });
});

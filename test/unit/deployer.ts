import { assert } from "chai";
import { BrowserProvider, Contract, TransactionReceipt } from "ethers";
import { Artifact } from "hardhat/types";
import { Deployer } from "../../src/deployer/Deployer";
import { useEnvironment } from "../helpers";

describe("deployer", () => {
  let contractArtifact: Artifact;
  let contractWithPayableConstructorArtifact: Artifact;
  let contractWithConstructorArgumentsArtifact: Artifact;
  let libraryArtifact: Artifact;
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
    libraryArtifact = await this.hre.artifacts.readArtifact("Library");

    deployer = new Deployer(this.hre);

    from = (await this.hre.ethers.getSigners())[0].address;
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

    const receipt: TransactionReceipt = await this.hre.ethers.provider.getTransactionReceipt(hash);

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

    const receipt: TransactionReceipt = await this.hre.ethers.provider.getTransactionReceipt(hash);

    assert.equal(receipt.status, 1);

    const balance = await this.hre.ethers.provider.getBalance(receipt.contractAddress);

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

    const receipt: TransactionReceipt = await this.hre.ethers.provider.getTransactionReceipt(hash);

    assert.equal(receipt.status, 1);

    const contract = new Contract(
      receipt.contractAddress!!,
      contractWithConstructorArgumentsArtifact.abi,
      await new BrowserProvider(this.hre.network.provider).getSigner(from)
    );

    const name = await contract.name();

    assert.equal(name, "Hello, world!");
  });

  it("should deploy external library", async function () {
    const tx = await deployer.createDeployTransaction(
      libraryArtifact.abi,
      libraryArtifact.bytecode,
      [],
      BigInt(0),
      from
    );

    const hash = await deployer.sendTransaction(tx, from);

    const receipt: TransactionReceipt = await this.hre.ethers.provider.getTransactionReceipt(hash);

    assert.equal(receipt.status, 1);
  });

  // it("should deploy contract with external library", async function () {
  //   const libraryTx = await deployer.createDeployTransaction(
  //     libraryArtifact.abi,
  //     libraryArtifact.bytecode,
  //     [],
  //     BigInt(0),
  //     from
  //   );

  //   const libraryHash = await deployer.sendTransaction(libraryTx, from);

  //   const libraryReceipt: TransactionReceipt = await this.hre.network.provider.request({
  //     method: "eth_getTransactionReceipt",
  //     params: [libraryHash],
  //   });

  //   assert.equal(libraryReceipt.status, 1);

  //   const libraryAddress = libraryReceipt.contractAddress!!;

  //   const contractTx = await deployer.createDeployTransaction(
  //     contractArtifact.abi,
  //     contractArtifact.bytecode,
  //     [],
  //     BigInt(0),
  //     from,
  //     { libraries: { Library: libraryAddress } }
  //   );

  //   const contractHash = await deployer.sendTransaction(contractTx, from);

  //   const contractReceipt: TransactionReceipt = await this.hre.network.provider.request({
  //     method: "eth_getTransactionReceipt",
  //     params: [contractHash],
  //   });

  //   assert.equal(contractReceipt.status, 1);
  // });
});

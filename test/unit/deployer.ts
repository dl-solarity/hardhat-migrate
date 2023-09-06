import { assert } from "chai";
import { BrowserProvider, Contract, Signer, TransactionReceipt } from "ethers";
import { artifacts } from "hardhat";
import { Artifact } from "hardhat/types";
import { Deployer } from "../../src/deployer/Deployer";
import { useEnvironment } from "../helpers";

describe("deployer", () => {
  let contractArtifact: Artifact;
  let contractWithPayableConstructorArtifact: Artifact;
  let contractWithConstructorArgumentsArtifact: Artifact;
  let libraryArtifact: Artifact;
  let deployer: any;
  let signer: Signer;

  useEnvironment("minimal");

  beforeEach("Loading hardhat environment", async function () {
    await this.hre.run("compile", { quiet: true });

    contractArtifact = await this.hre.artifacts.readArtifact("Contract");
    contractWithPayableConstructorArtifact = await this.hre.artifacts.readArtifact("ContractWithPayableConstructor");
    contractWithConstructorArgumentsArtifact = await this.hre.artifacts.readArtifact(
      "ContractWithConstructorArguments",
    );
    libraryArtifact = await this.hre.artifacts.readArtifact("Library");

    // @ts-ignore
    deployer = new Deployer(this.hre);

    signer = await this.hre.ethers.provider.getSigner(0);
  });

  it("should deploy contract", async function () {
    const tx = await deployer._createDeployTransaction(
      {
        abi: contractArtifact.abi,
        bytecode: contractArtifact.bytecode,
      },
      [],
      {},
    );

    const hash = (await signer.sendTransaction(tx)).hash;

    const receipt: TransactionReceipt = await this.hre.ethers.provider.getTransactionReceipt(hash);

    assert.equal(receipt.status, 1);
  });

  it("should deploy contract with value", async function () {
    const tx = await deployer._createDeployTransaction(
      {
        abi: contractWithPayableConstructorArtifact.abi,
        bytecode: contractWithPayableConstructorArtifact.bytecode,
      },
      [],
      { value: BigInt(1) },
    );

    const hash = (await signer.sendTransaction(tx)).hash;

    const receipt: TransactionReceipt = await this.hre.ethers.provider.getTransactionReceipt(hash);

    assert.equal(receipt.status, 1);

    const balance = await this.hre.ethers.provider.getBalance(receipt.contractAddress);

    assert.equal(balance, BigInt(1));
  });

  it("should deploy contract with constructor arguments", async function () {
    const tx = await deployer._createDeployTransaction(
      {
        abi: contractWithConstructorArgumentsArtifact.abi,
        bytecode: contractWithConstructorArgumentsArtifact.bytecode,
      },
      ["Hello, world!"],
      {},
    );

    const hash = (await signer.sendTransaction(tx)).hash;

    const receipt: TransactionReceipt = await this.hre.ethers.provider.getTransactionReceipt(hash);

    assert.equal(receipt.status, 1);

    const contract = new Contract(receipt.contractAddress!!, contractWithConstructorArgumentsArtifact.abi, signer);

    const name = await contract.name();

    assert.equal(name, "Hello, world!");
  });

  it("should deploy external library", async function () {
    const tx = await deployer._createDeployTransaction(
      { abi: libraryArtifact.abi, bytecode: libraryArtifact.bytecode },
      [],
      {},
    );

    const sentTx = await signer.sendTransaction(tx);

    const receipt: TransactionReceipt = await this.hre.ethers.provider.getTransactionReceipt(sentTx.hash);

    assert.equal(receipt.status, 1);
  });

  // it("should deploy contract with external library", async function () {
  //   const libraryTx = await deployer._createDeployTransaction(
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

  //   const contractTx = await deployer._createDeployTransaction(
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

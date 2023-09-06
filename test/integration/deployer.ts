import { Deployer } from "../../src/deployer/Deployer";
import { useEnvironment } from "../helpers";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";
import { expect } from "chai";
import { assert, BaseContract, Contract } from "ethers";
import { Artifact } from "hardhat/types";
import { EthersAdapter } from "../../src/deployer/adapters/EthersAdapter";
import { TruffleAdapter } from "../../src/deployer/adapters/TruffleAdapter";
import { Reporter } from "../../src/tools/reporter/Reporter";
import { ContractWithConstructorArguments } from "../fixture-projects/hardhat-project-minimal-typechain-ethers/typechain-types";

describe("deployer", () => {
  describe("deploy()", () => {
    const contractWithConstructorABI = [
      {
        inputs: [
          {
            internalType: "string",
            name: "_name",
            type: "string",
          },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
      },
      {
        inputs: [],
        name: "name",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ];
    const contractWithConstructorABI2 = [
      {
        type: "constructor",
        stateMutability: "undefined",
        payable: false,
        inputs: [{ type: "string", name: "_name" }],
      },
      {
        type: "function",
        name: "name",
        constant: true,
        stateMutability: "view",
        payable: false,
        inputs: [],
        outputs: [{ type: "string", name: "" }],
      },
    ];

    const contractWithConstructorBytecode =
      "0x608060405234801561001057600080fd5b5060405161033e38038061033e8339818101604052602081101561003357600080fd5b810190808051604051939291908464010000000082111561005357600080fd5b8382019150602082018581111561006957600080fd5b825186600182028301116401000000008211171561008657600080fd5b8083526020830192505050908051906020019080838360005b838110156100ba57808201518184015260208101905061009f565b50505050905090810190601f1680156100e75780820380516001836020036101000a031916815260200191505b50604052505050806000908051906020019061010492919061010b565b50506101a8565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061014c57805160ff191683800117855561017a565b8280016001018555821561017a579182015b8281111561017957825182559160200191906001019061015e565b5b509050610187919061018b565b5090565b5b808211156101a457600081600090555060010161018c565b5090565b610187806101b76000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c806306fdde0314610030575b600080fd5b6100386100b3565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561007857808201518184015260208101905061005d565b50505050905090810190601f1680156100a55780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b60008054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156101495780601f1061011e57610100808354040283529160200191610149565b820191906000526020600020905b81548152906001019060200180831161012c57829003601f168201915b50505050508156fea2646970667358221220aec3637098d07875a855895564516a5c25ef1a35c776565a65d53802d336fdca64736f6c63430007030033";

    describe("with truffle", () => {
      useEnvironment("minimal-truffle");

      let contractArtifact: TruffleContract;
      let contractWithConstructorArtifact: TruffleContract;

      let adapter: TruffleAdapter;
      let deployer: Deployer;

      beforeEach("setup", async function () {
        adapter = new TruffleAdapter(this.hre);

        deployer = new Deployer(this.hre, adapter, new Reporter(this.hre));

        contractArtifact = await this.hre.artifacts.require("Contract");
        contractWithConstructorArtifact = await this.hre.artifacts.require("ContractWithConstructorArguments");
      });

      describe("adapter", () => {
        it("should get abi", async () => {
          const abi = (adapter as any)._getABI(contractWithConstructorArtifact);

          expect(abi).to.deep.equal(contractWithConstructorABI);
        });

        it("should get bytecode", async () => {
          const bytecode = (adapter as any)._getBytecode(contractWithConstructorArtifact);

          expect(bytecode).to.equal(contractWithConstructorBytecode);
        });
      });

      it("should deploy contract", async function () {
        const contract: TruffleContract = await deployer.deploy(contractArtifact, [], {});
      });

      it("should deploy contract with constructor arguments", async function () {
        const contract: TruffleContract = await deployer.deploy(contractWithConstructorArtifact, ["test"], {});

        const name = await contract.name();

        expect(name).to.equal("test");
      });

      it("should revert if artifact is not a contract", async function () {
        await expect(deployer.deploy(null, [], {})).to.eventually.be.rejected;
      });
    });

    describe("with ethers", () => {
      useEnvironment("minimal-ethers");

      let contractArtifact: BaseContract;
      let contractWithConstructorArtifact: BaseContract;

      let adapter: EthersAdapter;
      let deployer: Deployer;

      beforeEach("setup", async function () {
        adapter = new EthersAdapter(this.hre);

        deployer = new Deployer(this.hre, adapter, null as any);

        contractArtifact = await this.hre.ethers.getContractFactory("Contract");

        contractWithConstructorArtifact = await this.hre.ethers.getContractFactory("ContractWithConstructorArguments");
      });

      describe("adapter", () => {
        it("should get abi", async () => {
          const abi = (adapter as any)._getABI(contractWithConstructorArtifact);

          expect(JSON.parse(abi)).to.deep.equal(contractWithConstructorABI2);
        });

        it("should get bytecode", async () => {
          const bytecode = (adapter as any)._getBytecode(contractWithConstructorArtifact);

          expect(bytecode).to.equal(contractWithConstructorBytecode);
        });
      });

      it("should deploy contract with constructor arguments", async function () {
        const contract = await deployer.deploy(contractWithConstructorArtifact, ["test"], {});

        const name = await contract.name();

        expect(name).to.equal("test");
      });

      it("should revert if artifact is not a contract", async function () {
        await expect(deployer.deploy(null, [], {})).to.eventually.be.rejected;
      });
    });

    describe("with typechain", () => {
      describe("ethers", () => {
        useEnvironment("minimal-typechain-ethers");

        let contract: Contract;
        let contractWithConstructor: ContractWithConstructorArguments;

        let adapter: EthersAdapter;
        let deployer: Deployer;

        beforeEach("setup", async function () {
          await this.hre.run("compile", { quiet: true });

          adapter = new EthersAdapter(this.hre);

          deployer = new Deployer(this.hre, adapter, null as any);

          contract = await this.hre.ethers.getContractFactory("Contract");

          contractWithConstructor = await this.hre.ethers.getContractFactory("ContractWithConstructorArguments");
        });

        describe("adapter", () => {
          it("should get abi", async () => {
            const abi = (adapter as any)._getABI(contractWithConstructor);

            expect(JSON.parse(abi)).to.deep.equal(contractWithConstructorABI2);
          });

          it("should get bytecode", async () => {
            const bytecode = (adapter as any)._getBytecode(contractWithConstructor);

            expect(bytecode).to.equal(contractWithConstructorBytecode);
          });
        });

        it("should deploy contract with constructor arguments", async function () {
          const contract = await deployer.deploy(contractWithConstructor, ["test"], {});

          const name = await contract.name();

          expect(name).to.equal("test");
        });

        it("should revert if artifact is not a contract", async function () {
          await expect(deployer.deploy(null, [], {})).to.eventually.be.rejected;
        });
      });
      describe("truffle", () => {
        useEnvironment("minimal-typechain-truffle");

        let contractArtifact: TruffleContract;
        let contractWithConstructorArtifact: TruffleContract;

        let adapter: TruffleAdapter;
        let deployer: Deployer;

        beforeEach("setup", async function () {
          await this.hre.run("compile", { quiet: true });

          adapter = new TruffleAdapter(this.hre);

          deployer = new Deployer(this.hre, adapter, null as any);

          contractArtifact = await this.hre.artifacts.require("Contract");

          contractWithConstructorArtifact = await this.hre.artifacts.require("ContractWithConstructorArguments");
        });

        describe("adapter", () => {
          it("should get abi", async () => {
            const abi = (adapter as any)._getABI(contractWithConstructorArtifact);

            expect(abi).to.deep.equal(contractWithConstructorABI);
          });

          it("should get bytecode", async () => {
            const bytecode = (adapter as any)._getBytecode(contractWithConstructorArtifact);

            expect(bytecode).to.equal(contractWithConstructorBytecode);
          });
        });

        it("should deploy contract with constructor arguments", async function () {
          const contract = await deployer.deploy(contractWithConstructorArtifact, ["test"], {});

          const name = await contract.name();

          expect(name).to.equal("test");
        });

        it("should revert if artifact is not a contract", async function () {
          await expect(deployer.deploy(null, [], {})).to.eventually.be.rejected;
        });
      });
    });
  });
});

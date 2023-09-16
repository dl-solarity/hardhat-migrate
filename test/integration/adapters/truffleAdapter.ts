import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { expect } from "chai";
import { Interface } from "ethers";

import { useEnvironment } from "../../helpers";

import { TruffleAdapter } from "../../../src/deployer/adapters/TruffleAdapter";
import { ArtifactsParser } from "../../../src/parser/ArtifactsParser";

describe("TruffleAdapter", () => {
  describe("getContractDeployParams()", () => {
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
    ] as const;

    const contractWithConstructorBytecode =
      "0x608060405234801561001057600080fd5b5060405161033e38038061033e8339818101604052602081101561003357600080fd5b810190808051604051939291908464010000000082111561005357600080fd5b8382019150602082018581111561006957600080fd5b825186600182028301116401000000008211171561008657600080fd5b8083526020830192505050908051906020019080838360005b838110156100ba57808201518184015260208101905061009f565b50505050905090810190601f1680156100e75780820380516001836020036101000a031916815260200191505b50604052505050806000908051906020019061010492919061010b565b50506101a8565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f1061014c57805160ff191683800117855561017a565b8280016001018555821561017a579182015b8281111561017957825182559160200191906001019061015e565b5b509050610187919061018b565b5090565b5b808211156101a457600081600090555060010161018c565b5090565b610187806101b76000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c806306fdde0314610030575b600080fd5b6100386100b3565b6040518080602001828103825283818151815260200191508051906020019080838360005b8381101561007857808201518184015260208101905061005d565b50505050905090810190601f1680156100a55780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b60008054600181600116156101000203166002900480601f0160208091040260200160405190810160405280929190818152602001828054600181600116156101000203166002900480156101495780601f1061011e57610100808354040283529160200191610149565b820191906000526020600020905b81548152906001019060200180831161012c57829003601f168201915b50505050508156fea2646970667358221220aec3637098d07875a855895564516a5c25ef1a35c776565a65d53802d336fdca64736f6c63430007030033";

    let adapter: TruffleAdapter;

    context("with pure truffle", () => {
      useEnvironment("minimal-truffle");

      let contractWithConstructorArtifact: TruffleContract;

      beforeEach("setup", async function () {
        adapter = new TruffleAdapter(this.hre);
        ArtifactsParser.parseArtifacts(this.hre);

        contractWithConstructorArtifact = await this.hre.artifacts.require("ContractWithConstructorArguments");
      });

      it("should get abi", async () => {
        const abi = adapter.getContractDeployParams(contractWithConstructorArtifact).abi;

        expect(abi).to.deep.equal(Interface.from(contractWithConstructorABI));
      });

      it("should get bytecode", async () => {
        const bytecode = adapter.getContractDeployParams(contractWithConstructorArtifact).bytecode;

        expect(bytecode).to.equal(contractWithConstructorBytecode);
      });

      it("should get contract name", async () => {
        const name = adapter.getContractDeployParams(contractWithConstructorArtifact).contractName;

        expect(name).to.equal("ContractWithConstructorArguments");
      });
    });

    context("with typechain", () => {
      useEnvironment("minimal-typechain-truffle");

      let contractWithConstructorArtifact: TruffleContract;

      beforeEach("setup", async function () {
        adapter = new TruffleAdapter(this.hre);
        ArtifactsParser.parseArtifacts(this.hre);

        contractWithConstructorArtifact = await this.hre.artifacts.require("ContractWithConstructorArguments");
      });

      it("should get abi", async () => {
        const abi = adapter.getContractDeployParams(contractWithConstructorArtifact).abi;

        expect(abi).to.deep.equal(Interface.from(contractWithConstructorABI));
      });

      it("should get bytecode", async () => {
        const bytecode = adapter.getContractDeployParams(contractWithConstructorArtifact).bytecode;

        expect(bytecode).to.equal(contractWithConstructorBytecode);
      });

      it("should get contract name", async () => {
        const name = adapter.getContractDeployParams(contractWithConstructorArtifact).contractName;

        expect(name).to.equal("ContractWithConstructorArguments");
      });
    });
  });
});

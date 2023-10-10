/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Contract, ContractFactory, ContractTransactionResponse, Interface } from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../common";
import type {
  ContractWithExternalLibrary,
  ContractWithExternalLibraryInterface,
} from "../../../another-contracts/Contracts2.sol/ContractWithExternalLibrary";

const _abi = [
  {
    inputs: [],
    name: "lib",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "lib2",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "lib3",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "lib4",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b5061023b806100206000396000f3fe608060405234801561001057600080fd5b506004361061004c5760003560e01c806336ecdf8f14610051578063928012301461006f578063eaebdc061461008d578063ff1a250f146100ab575b600080fd5b6100596100c9565b6040518082815260200191505060405180910390f35b6100776100d8565b6040518082815260200191505060405180910390f35b61009561015e565b6040518082815260200191505060405180910390f35b6100b361016d565b6040518082815260200191505060405180910390f35b60006100d36101f3565b905090565b600073__$caaab64972b707f3c433555dfa9c2b28a9$__63928012306040518163ffffffff1660e01b815260040160206040518083038186803b15801561011e57600080fd5b505af4158015610132573d6000803e3d6000fd5b505050506040513d602081101561014857600080fd5b8101908080519060200190929190505050905090565b60006101686101fc565b905090565b600073__$43892e6beba35e250f17c53d3e3a00fafd$__63928012306040518163ffffffff1660e01b815260040160206040518083038186803b1580156101b357600080fd5b505af41580156101c7573d6000803e3d6000fd5b505050506040513d60208110156101dd57600080fd5b8101908080519060200190929190505050905090565b60006003905090565b6000600390509056fea2646970667358221220bbcc9fc782641ed244e15a0ef75d253538968924676e816c679f75bbacaeb66264736f6c63430007030033";

type ContractWithExternalLibraryConstructorParams =
  | [linkLibraryAddresses: ContractWithExternalLibraryLibraryAddresses, signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: ContractWithExternalLibraryConstructorParams,
): xs is ConstructorParameters<typeof ContractFactory> => {
  return (
    typeof xs[0] === "string" ||
    (Array.isArray as (arg: any) => arg is readonly any[])(xs[0]) ||
    "_isInterface" in xs[0]
  );
};

export class ContractWithExternalLibrary__factory extends ContractFactory {
  constructor(...args: ContractWithExternalLibraryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      const [linkLibraryAddresses, signer] = args;
      super(_abi, ContractWithExternalLibrary__factory.linkBytecode(linkLibraryAddresses), signer);
    }
  }

  static linkBytecode(linkLibraryAddresses: ContractWithExternalLibraryLibraryAddresses): string {
    let linkedBytecode = _bytecode;

    linkedBytecode = linkedBytecode.replace(
      new RegExp("__\\$caaab64972b707f3c433555dfa9c2b28a9\\$__", "g"),
      linkLibraryAddresses["contracts/another-contracts/Contracts2.sol:Library1"].replace(/^0x/, "").toLowerCase(),
    );

    linkedBytecode = linkedBytecode.replace(
      new RegExp("__\\$43892e6beba35e250f17c53d3e3a00fafd\\$__", "g"),
      linkLibraryAddresses["contracts/another-contracts/Contracts2.sol:Library2"].replace(/^0x/, "").toLowerCase(),
    );

    return linkedBytecode;
  }

  override getDeployTransaction(
    overrides?: NonPayableOverrides & { from?: string },
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(overrides || {});
  }
  override deploy(overrides?: NonPayableOverrides & { from?: string }) {
    return super.deploy(overrides || {}) as Promise<
      ContractWithExternalLibrary & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(runner: ContractRunner | null): ContractWithExternalLibrary__factory {
    return super.connect(runner) as ContractWithExternalLibrary__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): ContractWithExternalLibraryInterface {
    return new Interface(_abi) as ContractWithExternalLibraryInterface;
  }
  static connect(address: string, runner?: ContractRunner | null): ContractWithExternalLibrary {
    return new Contract(address, _abi, runner) as unknown as ContractWithExternalLibrary;
  }
}

export interface ContractWithExternalLibraryLibraryAddresses {
  ["contracts/another-contracts/Contracts2.sol:Library1"]: string;
  ["contracts/another-contracts/Contracts2.sol:Library2"]: string;
}
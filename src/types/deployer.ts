import { BytesLike, ContractDeployTransaction, ContractFactory, FunctionFragment, Interface, Overrides } from "ethers";

import { Artifact, Libraries } from "hardhat/types";

export type Bytecode = BytesLike;

export type Args = Parameters<ContractFactory["getDeployTransaction"]>;

export type OverridesAndMisc = Overrides & { misc?: string };

export type OverridesAndLibs = OverridesAndMisc & { libraries?: Libraries };

export type ContractDeployTransactionWithContractName = ContractDeployTransaction & { contractName: string };

export interface ContractDeployParams {
  abi: Interface;
  bytecode: string;
  contractName?: string;
}

export interface Link {
  sourceName: string;
  libraryName: string;
  address: string;
}

export interface NeededLibrary {
  sourceName: string;
  libName: string;
}

export interface ArtifactExtended extends Artifact {
  neededLibraries: NeededLibrary[];
}

export interface TruffleTransactionResponse {
  tx: string;
  receipt: TransactionReceipt;
}

export interface TransactionReceipt {
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  blockNumber: string;
  from: string;
  to: string;
  gasUsed?: string;
  logs?: any[];
  logsBloom?: string;
  type?: string;
  status?: string;
  cumulativeGasUsed?: string;
  contractAddress?: string;
}

export type BaseTruffleMethod = {
  (...args: any[]): Promise<TruffleTransactionResponse>;
  call: (...args: any[]) => Promise<any>;
  sendTransaction: (...args: any[]) => Promise<TruffleTransactionResponse>;
  estimateGas: (...args: any[]) => Promise<any>;
  fragment: FunctionFragment;
};

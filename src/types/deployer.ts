import { BytesLike, ContractDeployTransaction, ContractFactory, Overrides } from "ethers";

import { Artifact, Libraries } from "hardhat/types";

export type Bytecode = BytesLike;

export type Args = Parameters<ContractFactory["getDeployTransaction"]>;

export type OverridesAndName = Overrides & { name?: string };

export type OverridesAndLibs = OverridesAndName & { libraries?: Libraries };

export type ContractDeployTxWithName = ContractDeployTransaction & { contractName: string };

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
  gasPrice?: string;
  effectiveGasPrice?: string;
  cumulativeGasUsed?: string;
  contractAddress?: string;
}

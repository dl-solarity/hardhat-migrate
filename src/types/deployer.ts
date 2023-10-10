import { BytesLike, ContractDeployTransaction, ContractFactory, Interface, InterfaceAbi, Overrides } from "ethers";

import { Artifact, Libraries } from "hardhat/types";

export type Abi = Interface | InterfaceAbi;

export type Bytecode = BytesLike;

export type DeployFactoryParams = ConstructorParameters<typeof ContractFactory>;

export type Args = Parameters<ContractFactory["getDeployTransaction"]>;

export type OverridesAndLibs = Overrides & { libraries?: Libraries };

export type ContractDeployTransactionWithContractName = ContractDeployTransaction & { contractName: string };

export interface ContractDeployParams {
  abi: Abi;
  bytecode: string;
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

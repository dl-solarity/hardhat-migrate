import { BytesLike, ContractFactory, Interface, InterfaceAbi, Overrides } from "ethers";
import { Libraries } from "hardhat/types";

export type Abi = Interface | InterfaceAbi;

export type Bytecode = BytesLike | { object: string };

export interface ContractDeployParams {
  abi: Abi;
  bytecode: string;
  contractName?: string;
}

export interface TruffleDeployParams extends ContractDeployParams {
  contractName: string;
}

export type DeployFactoryParams = ConstructorParameters<typeof ContractFactory>;

export type Args = Parameters<ContractFactory["getDeployTransaction"]>;

export type OverridesAndLibs = Overrides & { libraries?: Libraries };

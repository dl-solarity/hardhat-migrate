import { BytesLike, ContractFactory, Interface, InterfaceAbi } from "ethers";

export type Abi = Interface | InterfaceAbi;

export type Bytecode = BytesLike | { object: string };

export interface ContractDeployParams {
  abi: Abi;
  bytecode: Bytecode;
}

export interface TruffleDeployParams extends ContractDeployParams {
  contractName: string;
}

export type DeployFactoryParams = ConstructorParameters<typeof ContractFactory>;

export type Args = Parameters<ContractFactory["getDeployTransaction"]>;

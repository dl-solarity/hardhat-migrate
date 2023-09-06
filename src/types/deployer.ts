import { BytesLike, ContractFactory, Interface, InterfaceAbi } from "ethers";

export interface ContractDeployParams {
  abi: Interface | InterfaceAbi;
  bytecode: BytesLike | { object: string };
}

export interface TruffleDeployParams extends ContractDeployParams {
  contractName: string;
}

export type DeployFactoryParams = ConstructorParameters<typeof ContractFactory>;

export type Abi = DeployFactoryParams[0];

export type Bytecode = DeployFactoryParams[1];

export type Args = Parameters<ContractFactory["getDeployTransaction"]>;

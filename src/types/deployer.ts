import { ContractFactory } from "ethers";

export type deployFactoryParams = ConstructorParameters<typeof ContractFactory>;

export type abi = deployFactoryParams[0];

export type bytecode = deployFactoryParams[1];

export type args = Parameters<ContractFactory["getDeployTransaction"]>;

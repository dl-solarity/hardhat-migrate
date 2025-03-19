import { ContractFactory, InterfaceAbi } from "ethers";

import { Bytecode } from "./deployer";

export interface TypechainFactoryClass<A, I> {
  new (...args: any): A;

  abi: any;

  bytecode: any;

  createInterface(): any;

  connect(address: string, runner?: any): I;
}

export interface BytecodeFactory {
  abi: InterfaceAbi;
  bytecode: Bytecode;
  contractName: string;
}

type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any
  ? P extends [...infer Rest, any?]
    ? Rest
    : any
  : never[];

export type TypedArgs<A> = A extends { deploy(...args: any): any } ? Parameters<A["deploy"]> : any;

export type BaseInstance<A, I> =
  | Omit<TypechainFactoryClass<A, I>, "bytecode">
  | Omit<BytecodeFactory, "bytecode">
  | Omit<ContractFactory, "bytecode">;

export type Instance<A, I> = TypechainFactoryClass<A, I> | BytecodeFactory | ContractFactory;

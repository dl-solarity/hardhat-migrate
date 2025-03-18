import { ContractFactory, InterfaceAbi } from "ethers";

import { Bytecode } from "./deployer";

export interface BaseTypechainFactoryClass<A, I> {
  new (...args: any): A;

  abi: any;

  createInterface(): any;

  connect(address: string, runner?: any): I;
}

export interface TypechainFactoryClass<A, I> extends BaseTypechainFactoryClass<A, I> {
  bytecode: any;
}

export interface BaseBytecodeFactory {
  abi: InterfaceAbi;
  contractName: string;
}

export interface BytecodeFactory extends BaseBytecodeFactory {
  bytecode: Bytecode;
}

type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any
  ? P extends [...infer Rest, any?]
    ? Rest
    : any
  : never[];

export type TypedArgs<A> = A extends { deploy(...args: any): any } ? Parameters<A["deploy"]> : any;

export type BaseInstance<A, I> =
  | BaseTypechainFactoryClass<A, I>
  | BaseBytecodeFactory
  | Omit<ContractFactory, "bytecode">;

export type Instance<A, I> = TypechainFactoryClass<A, I> | BytecodeFactory | ContractFactory;

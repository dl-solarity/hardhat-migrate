import { ContractFactory, InterfaceAbi } from "ethers";

import { Bytecode } from "./deployer";

export interface EthersContract<A, I> {
  new (...args: any): A;

  abi: any;
  bytecode: any;

  createInterface(): any;

  connect(address: string, runner?: any): I;
}

export interface TruffleFactory<I> extends Truffle.Contract<I> {
  "new"(...args: any): Promise<I>;

  deployed(): Promise<I>;
  at(address: string): Promise<I>;
  link(name: string, address: string): void;
  link(contract: any): void;
  address: string;
  contractName: string;
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

type TruffleParameters<T extends { (...args: any[]): any }> = T extends { (...args: infer P): any }
  ? P extends [...infer Rest, any?]
    ? Rest
    : any
  : never;

export type TypedArgs<A> = A extends { deploy(...args: any): any }
  ? Parameters<A["deploy"]>
  : A extends { "new"(...args: any): any }
    ? TruffleParameters<A["new"]>
    : any;

export type Instance<A, I> = TruffleFactory<I> | EthersContract<A, I> | BytecodeFactory | ContractFactory;

import { InterfaceAbi, ContractFactory } from "ethers";

import { Bytecode } from "./deployer";

export interface EthersContract<A, I> {
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

export type Instance<A, I> = EthersContract<A, I> | BytecodeFactory | ContractFactory;

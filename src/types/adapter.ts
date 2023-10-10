/* eslint-disable @typescript-eslint/no-explicit-any */
import { Abi, Bytecode } from "./deployer";

export interface EthersFactory<A, I> {
  bytecode: any;
  abi: Abi;

  createInterface(): A;

  connect(address: string, runner?: any): I;
}

export interface TruffleFactory<I> {
  contractName: string;

  new (_name: string, meta?: any): Promise<I>;
}

export interface PureFactory<I> {
  abi: Abi;
  bytecode: Bytecode;
  contractName: I;
}

export type Instance<A, I> = TruffleFactory<I> | EthersFactory<A, I> | PureFactory<I>;

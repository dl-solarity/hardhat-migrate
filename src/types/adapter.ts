import { Abi, Bytecode } from "./deployer";

export interface EthersFactory<A, I> {
  new (...args: any): A;

  bytecode: any;
  abi: Abi;

  createInterface(): any;

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

type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any
  ? P extends [...infer Rest, any?]
    ? Rest
    : any
  : never[];

export type TypedArgs<A> = A extends { deploy(...args: any): any } ? Parameters<A["deploy"]> : any;

export type TypedInitArgs = any;

export type ProxyTypedArgs<A> = A extends { deploy(...args: any): any }
  ? OmitFirstArgument<Parameters<A["deploy"]>>
  : any;

export type Instance<A, I> = TruffleFactory<I> | EthersFactory<A, I> | PureFactory<I>;

type OmitFirstArgument<T extends any[]> = T extends [any, ...infer U] ? U : never;

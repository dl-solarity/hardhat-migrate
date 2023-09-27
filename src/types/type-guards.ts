import { EthersFactory, PureFactory, TruffleFactory } from "./adapter";

export function isEthersFactory<A, I>(instance: any): instance is EthersFactory<A, I> {
  return instance.createInterface !== undefined;
}

export function isTruffleFactory<I>(instance: any): instance is TruffleFactory<I> {
  return instance instanceof Function && instance.prototype.constructor !== undefined;
}

export function isPureFactory<I>(instance: any): instance is PureFactory<I> {
  return instance.contractName !== undefined;
}

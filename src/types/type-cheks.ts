import { ContractFactory } from "ethers";

import { KeyTxFields } from "./tools";

import { EthersFactory, PureFactory, TruffleFactory } from "./adapter";

import { MigrateError } from "../errors";

export function validateKeyTxFields(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const key = args[0] as KeyTxFields;

    if (!key.data || key.data == "") {
      throw new MigrateError(`KeyTxFields.data is not valid`);
    }

    if (!key.from || key.from == "") {
      throw new MigrateError(`KeyTxFields.from is not valid`);
    }

    if (!key.chainId || key.chainId.toString() == "0") {
      throw new MigrateError(`KeyTxFields.chainId is not valid`);
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

export function isEthersFactory<A, I>(instance: any): instance is EthersFactory<A, I> {
  return instance.createInterface !== undefined;
}

export function isTruffleFactory<I>(instance: any): instance is TruffleFactory<I> {
  return instance instanceof Function && instance.prototype.constructor !== undefined;
}

export function isPureFactory(instance: any): instance is PureFactory {
  return instance.contractName !== undefined;
}

export function isContractFactory(instance: any): instance is ContractFactory {
  return instance.interface !== undefined && instance.bytecode !== undefined;
}

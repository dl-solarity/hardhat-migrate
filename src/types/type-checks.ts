import { ContractFactory } from "ethers";

import { EthersContract, BytecodeFactory, TruffleFactory } from "./adapter";
import { BaseTxFields, KeyDeploymentFields, KeyTransactionFields } from "./tools";

import { MigrateError } from "../errors";

export function validateKeyDeploymentFields(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const key = args[0] as KeyDeploymentFields;

    baseTxValidation(key, "KeyDeploymentFields");

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

export function validateKeyTxFields(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const key = args[0] as KeyTransactionFields;

    baseTxValidation(key, "KeyTransactionFields");

    if (!key.to || key.to === "") {
      throw new MigrateError(`KeyTransactionFields.to is not valid`);
    }

    if (key.name === undefined) {
      throw new MigrateError(`KeyTransactionFields.name is not valid`);
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

export function isEthersContract<A, I>(instance: any): instance is EthersContract<A, I> {
  return instance.createInterface !== undefined;
}

export function isTruffleFactory<I>(instance: any): instance is TruffleFactory<I> {
  return instance instanceof Function && instance.prototype.constructor !== undefined;
}

export function isBytecodeFactory(instance: any): instance is BytecodeFactory {
  return instance.contractName !== undefined;
}

export function isContractFactory(instance: any): instance is ContractFactory {
  return instance.interface !== undefined && instance.bytecode !== undefined;
}

function baseTxValidation(key: BaseTxFields, namespace: string) {
  if (!key.data || key.data === "") {
    throw new MigrateError(`${namespace}.data is not valid`);
  }

  if (!key.from || key.from === "") {
    throw new MigrateError(`${namespace}.from is not valid`);
  }

  if (!key.chainId || key.chainId === 0n) {
    throw new MigrateError(`${namespace}.chainId is not valid`);
  }

  if (key.value === undefined) {
    throw new MigrateError(`${namespace}.value is not valid`);
  }
}

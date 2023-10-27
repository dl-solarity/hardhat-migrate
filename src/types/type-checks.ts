import { ContractFactory } from "ethers";

import { EthersContract, BytecodeFactory, TruffleFactory } from "./adapter";
import { KeyDeploymentFields, KeyTransactionFields } from "./tools";

import { MigrateError } from "../errors";

export function validateKeyDeploymentFields(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const key = args[0] as KeyDeploymentFields;

    if (!key.data || key.data === "") {
      throw new MigrateError(`KeyDeploymentFields.data is not valid`);
    }

    if (!key.from || key.from === "") {
      throw new MigrateError(`KeyDeploymentFields.from is not valid`);
    }

    if (!key.chainId || key.chainId === 0n) {
      throw new MigrateError(`KeyDeploymentFields.chainId is not valid`);
    }

    if (key.value === undefined) {
      throw new MigrateError(`KeyDeploymentFields.value is not valid`);
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

export function validateKeyTxFields(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const key = args[0] as KeyTransactionFields;

    if (!key.data || key.data === "") {
      throw new MigrateError(`KeyDeploymentFields.data is not valid`);
    }

    if (!key.from || key.from === "") {
      throw new MigrateError(`KeyDeploymentFields.from is not valid`);
    }

    if (!key.chainId || key.chainId === 0n) {
      throw new MigrateError(`KeyDeploymentFields.chainId is not valid`);
    }

    if (!key.to || key.to === "") {
      throw new MigrateError(`KeyDeploymentFields.to is not valid`);
    }

    if (key.value === undefined) {
      throw new MigrateError(`KeyDeploymentFields.value is not valid`);
    }

    return originalMethod.apply(this, args);
  };

  return descriptor;
}

export function isEthersFactory<A, I>(instance: any): instance is EthersContract<A, I> {
  return instance.createInterface !== undefined;
}

export function isTruffleFactory<I>(instance: any): instance is TruffleFactory<I> {
  return instance instanceof Function && instance.prototype.constructor !== undefined;
}

export function isPureFactory(instance: any): instance is BytecodeFactory {
  return instance.contractName !== undefined;
}

export function isContractFactory(instance: any): instance is ContractFactory {
  return instance.interface !== undefined && instance.bytecode !== undefined;
}

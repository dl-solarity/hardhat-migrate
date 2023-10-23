import { join } from "path";
import { realpathSync, existsSync } from "fs";
import { AddressLike, FunctionFragment, hexlify, id, Overrides, toBigInt } from "ethers";

import { isBytes } from "@ethersproject/bytes";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MigrateError } from "./errors";

import { KeyDeploymentFields, KeyTransactionFields } from "./types/tools";
import { Bytecode } from "./types/deployer";

export async function getSignerHelper(
  hre: HardhatRuntimeEnvironment,
  from?: null | AddressLike,
): Promise<HardhatEthersSigner> {
  if (!from) {
    return hre.ethers.provider.getSigner();
  }

  const address = await hre.ethers.resolveAddress(from, hre.ethers.provider);

  return hre.ethers.getSigner(address as string);
}

export async function fillParameters(hre: HardhatRuntimeEnvironment, parameters: Overrides): Promise<Overrides> {
  if (parameters.from === undefined) {
    parameters.from = await (await hre.ethers.provider.getSigner()).getAddress();
  }

  if (parameters.chainId === undefined) {
    parameters.chainId = await getChainId(hre);
  }

  if (parameters.value === undefined) {
    parameters.value = 0;
  }

  return parameters;
}

export function underline(str: string): string {
  return `\u001b[4m${str}\u001b[0m`;
}

export function resolvePathToFile(path: string, file: string = ""): string {
  if (!existsSync(join(path, file))) {
    path = "./";
  }

  return join(realpathSync(path), file);
}

export async function getChainId(hre: HardhatRuntimeEnvironment): Promise<bigint> {
  return toBigInt(await hre.ethers.provider.send("eth_chainId"));
}

export function toJSON(data: any): string {
  return JSON.stringify(data, JSONConvertor, 2);
}

export function JSONConvertor(_key: any, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  return value;
}

export function bytecodeHash(bytecode: any): string {
  return id(bytecodeToString(bytecode));
}

export function createKeyDeploymentFieldsHash(keyTxFields: KeyDeploymentFields): string {
  const obj: KeyDeploymentFields = {
    data: keyTxFields.data,
    from: keyTxFields.from,
    chainId: keyTxFields.chainId,
    value: keyTxFields.value,
  };

  return id(toJSON(obj));
}

export function createKeyTxFieldsHash(keyTxFields: KeyTransactionFields): string {
  const obj: KeyTransactionFields = {
    data: keyTxFields.data,
    from: keyTxFields.from,
    chainId: keyTxFields.chainId,
    to: keyTxFields.to,
    value: keyTxFields.value,
  };

  return id(toJSON(obj));
}

export async function isDeployedContractAddress(hre: HardhatRuntimeEnvironment, address: string): Promise<boolean> {
  return (await hre.ethers.provider.getCode(address)) !== "0x";
}

export function bytecodeToString(bytecode: Bytecode): string {
  let bytecodeHex: string;

  if (typeof bytecode === "string") {
    bytecodeHex = bytecode;
  } else if (isBytes(bytecode)) {
    bytecodeHex = hexlify(bytecode);
  } else {
    throw new MigrateError(`Invalid bytecode: ${bytecode}`);
  }

  // Make sure it is 0x prefixed
  if (bytecodeHex.substring(0, 2) !== "0x") {
    bytecodeHex = "0x" + bytecodeHex;
  }

  return bytecodeHex;
}

export function getMethodString(
  contractName: string,
  methodName: string,
  methodFragment: FunctionFragment = {} as FunctionFragment,
  args: any[] = [],
): string {
  if (methodFragment.inputs === undefined) {
    return `${contractName}.${methodName}`;
  }
  const argsString = args.map((arg, i) => `${methodFragment.inputs[i].name}:${arg}`).join(", ");

  const methodSting = `${contractName}.${methodName}(${argsString})`;

  if (methodSting.length > 60) {
    const shortenMethodString = `${contractName}.${methodName}(${args.length} arguments)`;

    if (shortenMethodString.length > 60) {
      return `${contractName.split(":").pop()}.${methodName}(${args.length} arguments)`;
    }
  }

  return methodSting;
}

export async function waitForBlock(hre: HardhatRuntimeEnvironment, desiredBlock: number) {
  return new Promise<void>((resolve) => {
    hre.ethers.provider.on("block", (blockNumber) => {
      if (blockNumber == desiredBlock) {
        resolve();
      }
    });
  });
}

export function catchError(target: any, propertyName?: string, descriptor?: PropertyDescriptor) {
  // Method decorator
  if (descriptor) {
    _generateDescriptor(propertyName!, descriptor);
  }
  // Class decorator
  else {
    for (const propertyName of Reflect.ownKeys(target.prototype).filter((prop) => prop !== "constructor")) {
      const desc = Object.getOwnPropertyDescriptor(target.prototype, propertyName)!;
      const isMethod = desc.value instanceof Function;
      if (!isMethod) continue;
      Object.defineProperty(
        target.prototype,
        propertyName,
        _generateDescriptor(`${target.prototype.constructor.name}.${propertyName.toString()}`, desc),
      );
    }
  }
}

/* eslint-disable no-console */
export function suppressLogs(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const log = console.log;

    console.log = () => {};

    const result = originalMethod.apply(this, args);

    console.log = log;

    return result;
  };

  return descriptor;
}
/* eslint-enable no-console */

function _generateDescriptor(propertyName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const method = descriptor.value;

  descriptor.value = function ___ErrorCatcher(...args: any[]) {
    try {
      const result = method.apply(this, args);

      // Check if the method is asynchronous
      if (result && result instanceof Promise) {
        // Return promise
        return result.catch((e: any) => {
          _handleError(propertyName, e);
        });
      }

      // Return actual result
      return result;
    } catch (e: any) {
      _handleError(propertyName, e);
    }
  };

  return descriptor;
}

function _handleError(propertyName: string, error: any) {
  throw new MigrateError(`${propertyName}(): ${error.message ?? error}`, { cause: error });
}

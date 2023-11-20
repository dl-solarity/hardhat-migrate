import axios from "axios";

import { join } from "path";
import { realpathSync, existsSync } from "fs";
import {
  id,
  hexlify,
  toBigInt,
  ethers,
  Overrides,
  Interface,
  Fragment,
  AddressLike,
  InterfaceAbi,
  JsonFragment,
  FunctionFragment,
  ConstructorFragment,
} from "ethers";

import { isBytes } from "@ethersproject/bytes";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { MigrateError } from "./errors";

import { KeyDeploymentFields, KeyTransactionFields } from "./types/tools";
import { Bytecode } from "./types/deployer";
import { Provider } from "./tools/Provider";

export async function getSignerHelper(from?: null | AddressLike): Promise<HardhatEthersSigner> {
  if (!from) {
    return Provider.provider.getSigner();
  }

  const address = await ethers.resolveAddress(from, Provider.provider);

  return Provider.provider.getSigner(address);
}

export async function fillParameters(parameters: Overrides): Promise<Overrides> {
  if (parameters.from === undefined) {
    parameters.from = await (await Provider.provider.getSigner()).getAddress();
  }

  if (parameters.chainId === undefined) {
    parameters.chainId = await getChainId();
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

export async function getChainId(): Promise<bigint> {
  return toBigInt(await Provider.provider.send("eth_chainId"));
}

export function toJSON(data: any): string {
  return JSON.stringify(data, JSONConvertor);
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
    name: keyTxFields.name,
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

export async function isDeployedContractAddress(address: string): Promise<boolean> {
  return (await Provider.provider.getCode(address)) !== "0x";
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
    return `${contractName}.${methodName}()`;
  }
  const argsString = methodFragment.inputs.map((input, i) => `${input.name}:${args[i]}`).join(", ");

  const methodSting = `${contractName}.${methodName}(${argsString})`;

  if (methodSting.length > 60) {
    const shortenMethodString = `${contractName}.${methodName}(${args.length} arguments)`;

    if (shortenMethodString.length > 60) {
      return `${contractName.split(":").pop()}.${methodName}(${args.length} arguments)`;
    }
  }

  return methodSting;
}

export async function waitForBlock(desiredBlock: number) {
  return new Promise<void>((resolve) => {
    Provider.provider.on("block", (blockNumber) => {
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

export function getInterfaceOnlyWithConstructor(fragments: InterfaceAbi): Interface {
  let abi: ReadonlyArray<Fragment | JsonFragment | string>;
  if (typeof fragments === "string") {
    abi = JSON.parse(fragments);
  } else {
    abi = fragments;
  }

  const fragment = abi.find((a: any) => a.type === "constructor");

  if (fragment !== undefined) {
    return Interface.from([fragment]);
  }

  return new Interface([ConstructorFragment.from("constructor()")]);
}

/* eslint-disable no-console */
export function suppressLogs(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const log = console.log;

    console.log();
    console.log = () => {};

    const result = originalMethod.apply(this, args);

    console.log = log;

    return result;
  };

  return descriptor;
}
/* eslint-enable no-console */

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function isOnline(): Promise<boolean> {
  try {
    await axios.get("https://www.google.com");
    return true;
  } catch {
    return false;
  }
}

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

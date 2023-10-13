import { AddressLike, hexlify, id } from "ethers";
import { realpathSync } from "fs";
import { join } from "path";

import { isBytes } from "@ethersproject/bytes";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MigrateError } from "./errors";

import { Bytecode } from "./types/deployer";
import { KeyTxFields } from "./types/tools";

export async function getSignerHelper(
  hre: HardhatRuntimeEnvironment,
  from?: null | AddressLike,
): Promise<HardhatEthersSigner> {
  if (!from) {
    return hre.ethers.provider.getSigner();
  }

  const address = await hre.ethers.resolveAddress(from, hre.ethers.provider);

  return hre.ethers.getSigner(address);
}

export function underline(str: string): string {
  return `\u001b[4m${str}\u001b[0m`;
}

export function resolvePathToFile(path: string, file: string = ""): string {
  return join(realpathSync(path), file);
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

export function createHash(keyTxFields: KeyTxFields): string {
  // TODO: rewrite
  const obj = { data: keyTxFields.data, from: keyTxFields.from, chaId: keyTxFields.chainId };

  return id(toJSON(obj));
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

function _generateDescriptor(propertyName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
  const method = descriptor.value;

  descriptor.value = function ___ErrorCatcher(...args: any[]) {
    try {
      const result = method.apply(this, args);

      // Check if method is asynchronous
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

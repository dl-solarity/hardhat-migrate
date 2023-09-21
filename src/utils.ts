import { join } from "path";
import { realpathSync } from "fs";
import { AddressLike, hexlify, id } from "ethers";

import { isBytes } from "@ethersproject/bytes";

import { MigrateError } from "./errors";

import { Bytecode } from "./types/deployer";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

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

export function resolvePathToFile(path: string, file: string = ""): string {
  return join(realpathSync(path), file);
}

export function JSONConvertor(key: any, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  return value;
}

export function bytecodeHash(bytecode: any): string {
  return id(String(bytecode));
}

export function bytecodeToString(bytecode: Bytecode): string {
  let bytecodeHex: string;

  if (typeof bytecode === "string") {
    bytecodeHex = bytecode;
  } else if (isBytes(bytecode)) {
    bytecodeHex = hexlify(bytecode);
  } else if (bytecode && typeof bytecode.object === "string") {
    bytecodeHex = (<any>bytecode).object;
  } else {
    throw new MigrateError(`Invalid bytecode: ${bytecode}`);
  }

  // Make sure it is 0x prefixed
  if (bytecodeHex.substring(0, 2) !== "0x") {
    bytecodeHex = "0x" + bytecodeHex;
  }

  return bytecodeHex;
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

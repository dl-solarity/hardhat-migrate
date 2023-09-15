import { realpathSync } from "fs";
import { join } from "path";

import { MigrateError } from "./errors";

export function resolvePathToFile(path_: string, file_: string = ""): string {
  return join(realpathSync(path_), file_);
}

export function contractNameFromSourceCode(code: string): string | null {
  const regex = /class\s+(\w+)\s+/g;

  const matches = regex.exec(code);

  if (matches) {
    const res = matches[1];

    if (res.endsWith("__factory")) {
      return res.slice(0, -9);
    }
  }

  return null;
}

export function JSONConvertor(key: any, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  return value;
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

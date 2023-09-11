import { realpathSync } from "fs";
import { join } from "path";

import { MigrateError } from "./errors";

export function resolvePathToFile(path_: string, file_: string = ""): string {
  return join(realpathSync(path_), file_);
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

  descriptor.value = async function ___ErrorCatcher(...args: any[]) {
    try {
      return await method.apply(this, args);
    } catch (e: unknown) {
      if (e instanceof Error) {
        _handleError(propertyName, e);
      }

      throw e;
    }
  };

  return descriptor;
}

function _handleError(propertyName: string, error: Error) {
  throw new MigrateError(`${propertyName}(): ${error.message}`, { cause: error });
}

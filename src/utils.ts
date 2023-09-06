import { realpathSync } from "fs";
import { join } from "path";

import { MigrateError } from "./errors";

export function resolvePathToFile(path_: string, file_: string = ""): string {
  return join(realpathSync(path_), file_);
}

export function catchError(target: any, propertyName: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;

  descriptor.value = async function (...args: any) {
    try {
      return await method.apply(this, args);
    } catch (error: any) {
      throw new MigrateError(`${propertyName}() failed: ${error}`);
    }
  };
}

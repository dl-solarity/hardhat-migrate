import { join } from "path";
import { realpathSync, existsSync } from "fs";

export function resolvePathToFile(path: string, file: string = ""): string {
  if (!existsSync(path)) {
    path = "./";
  }

  return join(realpathSync(path), file);
}

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function toJSON(data: any): string {
  return JSON.stringify(data, JSONConvertor);
}

function JSONConvertor(_key: any, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }

  return value;
}

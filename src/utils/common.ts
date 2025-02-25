import { join, sep } from "path";
import { formatEther, formatUnits } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { UNKNOWN_CONTRACT_NAME } from "../constants";

export function castAmount(value: bigint, nativeSymbol: string = "ETH"): string {
  if (value > 0n && value < 10n ** 12n) {
    return toGWei(value) + " GWei";
  }

  return formatEther(value) + ` ${nativeSymbol}`;
}

export function toGWei(value: bigint): string {
  return formatUnits(value, "gwei");
}

export function resolvePathToFile(hre: HardhatRuntimeEnvironment, path: string, file: string = ""): string {
  const pathToMigration = join(hre.config.paths.root, path, file);

  return pathToMigration.endsWith(sep) ? pathToMigration.slice(0, -1) : pathToMigration;
}

export function getInstanceNameFromClass(instance: any): string {
  const className = parseClassName(instance.toString());

  return className === undefined ? UNKNOWN_CONTRACT_NAME : className.replace("__factory", "");
}

function parseClassName(classDefinitionString: string) {
  // Regular expression to match the class name
  const classNameRegex = /class\s+([^\s]+)\s*\{/;

  const match = classDefinitionString.match(classNameRegex);
  if (match && match.length > 1) {
    return match[1];
  }

  return undefined;
}

export function deepCopy<T>(obj: T): T {
  return JSON.parse(toJSON(obj));
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

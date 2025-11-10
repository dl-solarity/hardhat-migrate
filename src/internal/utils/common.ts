import { join, sep } from "path";
import { toBeHex, formatEther, formatUnits, ethers } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { BEACON_IMPLEMENTATION_SLOT, DEFAULT_IMPLEMENTATION_SLOT, UNKNOWN_CONTRACT_NAME } from "../constants";

import { networkManager } from "../tools/network/NetworkManager";

export async function getPossibleImplementationAddress(proxyAddress: string): Promise<string> {
  const provider = (await networkManager!.getSigner()).provider;

  let implementationAddress = toBeHex(await provider!.getStorage(proxyAddress, DEFAULT_IMPLEMENTATION_SLOT), 20);
  if (implementationAddress !== ethers.ZeroAddress) {
    return implementationAddress;
  }

  implementationAddress = toBeHex(await provider!.getStorage(proxyAddress, BEACON_IMPLEMENTATION_SLOT), 20);
  if (implementationAddress !== ethers.ZeroAddress) {
    return implementationAddress;
  }

  return ethers.ZeroAddress;
}

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

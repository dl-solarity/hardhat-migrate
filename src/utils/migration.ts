import {
  id,
  hexlify,
  Fragment,
  Interface,
  Overrides,
  InterfaceAbi,
  JsonFragment,
  FunctionFragment,
  ConstructorFragment,
} from "ethers";
import { isBytes } from "@ethersproject/bytes";

import { getChainId } from "./network";
import { deepCopy, toJSON } from "./common";

import { MigrateError } from "../errors";
import { UNKNOWN_CONTRACT_NAME } from "../constants";

import { Bytecode } from "../types/deployer";
import { KeyDeploymentFields, KeyTransactionFields } from "../types/tools";

export async function fillParameters(parameters: Overrides): Promise<Overrides> {
  if (parameters.chainId === undefined) {
    parameters.chainId = await getChainId();
  }

  if (parameters.value === undefined) {
    parameters.value = 0;
  }

  return parameters;
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
    name: keyTxFields.name,
  };

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

export function getMethodString(
  contractName: string,
  methodName: string,
  methodFragment: FunctionFragment = {} as FunctionFragment,
  args: any[] = [],
): string {
  if (contractName === UNKNOWN_CONTRACT_NAME) {
    contractName = "Unidentified Contract";
  }

  const copyOfArgs = deepCopy(args);

  if (methodFragment.inputs.length + 1 === copyOfArgs.length) {
    copyOfArgs.pop();
  }

  if (methodFragment.inputs === undefined) {
    return `${contractName}.${methodName}()`;
  }
  const argsString = methodFragment.inputs.map((input, i) => `${input.name}:${copyOfArgs[i]}`).join(", ");

  const methodSting = `${contractName}.${methodName}(${argsString})`;

  if (methodSting.length > 60) {
    const shortenMethodString = `${contractName}.${methodName}(${copyOfArgs.length} arguments)`;

    if (shortenMethodString.length > 60) {
      return `${contractName.split(":").pop()}.${methodName}(${copyOfArgs.length} arguments)`;
    }
  }

  return methodSting;
}

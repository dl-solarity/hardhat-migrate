import { TransactionStorage } from "./Storage";

import { MigrateError } from "../../errors";

import { catchError, createHash } from "../../utils";

import { KeyTxFields } from "../../types/tools";

@catchError
export class TransactionProcessor {
  public static saveDeploymentTransaction(args: KeyTxFields, contractName: string, address: string) {
    this._saveDeploymentTransactionByTx(args, address);
    this._saveDeploymentTransactionByName(contractName, address);
  }

  public static getDeploymentTransaction(key: KeyTxFields | string): string {
    if (typeof key !== "string") {
      key = createHash(key);
    }

    const value = TransactionStorage.get(key);

    if (!value) {
      throw new MigrateError(`Transaction not found in storage`);
    }

    return value;
  }

  private static _saveDeploymentTransactionByTx(args: KeyTxFields, address: string) {
    const hash = createHash(args);

    TransactionStorage.set(hash, address, true);
  }

  private static _saveDeploymentTransactionByName(contractName: string, address: string) {
    TransactionStorage.set(contractName, address, true);
  }
}

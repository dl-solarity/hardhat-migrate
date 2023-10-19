import { ContractTransaction, ContractTransactionResponse, isAddress } from "ethers";

import { TransactionStorage } from "./Storage";

import { MigrateError } from "../../errors";

import { catchError, createHash } from "../../utils";

import { KeyTxFields } from "../../types/tools";
import { TruffleTransactionResponse } from "../../types/deployer";

@catchError
export class TransactionProcessor {
  public static saveDeploymentTransaction(args: KeyTxFields, contractName: string, address: string) {
    this._saveTransactionByTx(args, address);
    this._saveDeploymentTransactionByName(contractName, address);
  }

  public static saveDeploymentByName(contractName: string, address: string) {
    this._saveDeploymentTransactionByName(contractName, address);
  }

  public static saveTransaction(tx: ContractTransaction) {
    this._saveTransactionByTx(tx, tx);
  }

  public static tryRestoreSavedContractAddress(key: KeyTxFields | string): string {
    const contractAddress = this._tryGetDataFromStorage(key);

    if (!isAddress(contractAddress)) {
      throw new MigrateError(`Contract address is not valid`);
    }

    return contractAddress;
  }

  public static tryRestoreSavedTransaction(key: KeyTxFields): ContractTransactionResponse {
    return this._tryGetDataFromStorage(key);
  }

  public static tryRecoverTruffleTransaction(key: KeyTxFields): TruffleTransactionResponse {
    return this._tryGetDataFromStorage(key);
  }

  private static _tryGetDataFromStorage(key: KeyTxFields | string): any {
    if (typeof key !== "string") {
      key = createHash(key);
    }

    const value = TransactionStorage.get(key);

    if (!value) {
      throw new MigrateError(`Transaction not found in storage`);
    }

    return value;
  }

  private static _saveTransactionByTx(args: KeyTxFields, data: string | ContractTransaction) {
    const hash = createHash(args);

    TransactionStorage.set(hash, data, true);
  }

  private static _saveDeploymentTransactionByName(contractName: string, address: string) {
    TransactionStorage.set(contractName, address, true);
  }
}

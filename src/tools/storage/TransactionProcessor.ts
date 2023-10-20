import { ContractTransaction, ContractTransactionResponse, isAddress } from "ethers";

import { TransactionStorage } from "./MigrateStorage";

import { MigrateError } from "../../errors";

import { catchError, createHash } from "../../utils";

import { KeyTxFields } from "../../types/tools";
import { validateKeyTxFields } from "../../types/type-cheks";
import { TruffleTransactionResponse } from "../../types/deployer";

@catchError
export class TransactionProcessor {
  @validateKeyTxFields
  public static saveDeploymentTransaction(args: KeyTxFields, contractName: string, address: string) {
    this._saveContractAddress(args, address);
    this._saveDeploymentTransactionByName(contractName, address);
  }

  /**
   * @param tx - Transaction to save. Acts as a key and value at the same time.
   */
  public static saveTransaction(tx: ContractTransaction) {
    this._saveContractTransaction(tx, tx);
  }

  @validateKeyTxFields
  public static tryRestoreContractAddressByKeyFields(key: KeyTxFields): string {
    const contractAddress = this._tryGetDataFromStorage(createHash(key));

    if (!isAddress(contractAddress)) {
      throw new MigrateError(`Contract address is not valid`);
    }

    return contractAddress;
  }

  public static tryRestoreContractAddressByName(contractName: string): string {
    const contractAddress = this._tryGetDataFromStorage(contractName);

    if (!isAddress(contractAddress)) {
      throw new MigrateError(`Contract address is not valid`);
    }

    return contractAddress;
  }

  @validateKeyTxFields
  public static tryRestoreSavedTransaction(key: KeyTxFields): ContractTransactionResponse {
    return this._tryGetDataFromStorage(createHash(key));
  }

  @validateKeyTxFields
  public static tryRecoverTruffleTransaction(key: KeyTxFields): TruffleTransactionResponse {
    return this._tryGetDataFromStorage(createHash(key));
  }

  private static _tryGetDataFromStorage(key: string): any {
    const value = TransactionStorage.get(key);

    if (!value) {
      throw new MigrateError(`Transaction not found in storage`);
    }

    return value;
  }

  @validateKeyTxFields
  private static _saveContractTransaction(args: KeyTxFields, transaction: ContractTransaction) {
    TransactionStorage.set(createHash(args), transaction, true);
  }

  @validateKeyTxFields
  private static _saveContractAddress(args: KeyTxFields, contractAddress: string) {
    TransactionStorage.set(createHash(args), contractAddress, true);
  }

  private static _saveDeploymentTransactionByName(contractName: string, address: string) {
    TransactionStorage.set(contractName, address, true);
  }
}

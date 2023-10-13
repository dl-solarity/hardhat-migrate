import { TransactionStorage } from "./Storage";

import { MigrateError } from "../../errors";

import { catchError, createHash, toJSON } from "../../utils";

import { ContractTransaction, ContractTransactionResponse, isAddress } from "ethers";
import { KeyTxFields } from "../../types/tools";
import { VerifierBatchArgs } from "../../types/verifier";

@catchError
export class TransactionProcessor {
  public static saveDeploymentTransaction(args: KeyTxFields, contractName: string, address: string) {
    this._saveTransactionByTx(args, address);
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

  public static saveVerificationFunction(verifierArgs: VerifierBatchArgs) {
    const key = "TO_VERIFICATION";
    const data = (TransactionStorage.get(key) || []) as string[];

    data.push(toJSON(verifierArgs));
    TransactionStorage.set(key, data, true);
  }

  public static restoreSavedVerificationFunctions(): VerifierBatchArgs[] {
    const key = "TO_VERIFICATION";
    const data = (TransactionStorage.get(key) || []) as string[];

    return data.map((item: string) => JSON.parse(item));
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

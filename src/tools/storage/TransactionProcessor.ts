import { ContractDeployTransaction, isAddress, TransactionReceiptParams } from "ethers";

import { TransactionStorage } from "./MigrateStorage";

import { Reporter } from "../reporters/Reporter";

import { MigrateError } from "../../errors";

import {
  catchError,
  createKeyDeploymentFieldsHash,
  createKeyTxFieldsHash,
  isDeployedContractAddress,
} from "../../utils";

import {
  ContractFieldsToSave,
  KeyTransactionFields,
  MigrationMetadata,
  TransactionFieldsToSave,
  UNKNOWN_CONTRACT_NAME,
} from "../../types/tools";
import { validateKeyDeploymentFields, validateKeyTxFields } from "../../types/type-checks";

@catchError
export class TransactionProcessor {
  @catchError
  @validateKeyDeploymentFields
  public static saveDeploymentTransaction(
    args: ContractDeployTransaction,
    contractName: string,
    contractAddress: string,
    metadata: MigrationMetadata,
  ) {
    const dataToSave: ContractFieldsToSave = {
      contractKeyData: {
        data: args.data,
        from: args.from!,
        chainId: args.chainId!,
        value: args.value!,
      },
      contractAddress,
      contractName,
      metadata,
    };

    if (contractName === UNKNOWN_CONTRACT_NAME) {
      this._saveContract(args, dataToSave);

      return;
    }

    if (TransactionStorage.has(contractName)) {
      this._processCollision(contractName, dataToSave);
    }

    this._saveContractByName(contractName, dataToSave);
  }

  /**
   * @param tx - Transaction to save. Acts as a key and value at the same time.
   * @param receipt
   * @param metadata
   */
  @validateKeyTxFields
  public static saveTransaction(
    tx: KeyTransactionFields,
    receipt: TransactionReceiptParams,
    metadata: MigrationMetadata,
  ) {
    this._saveTransaction(
      {
        data: tx.data,
        from: tx.from,
        chainId: tx.chainId,
        to: tx.to,
        value: tx.value,
      },
      receipt,
      metadata,
    );
  }

  @catchError
  @validateKeyDeploymentFields
  public static async tryRestoreContractAddressByKeyFields(key: ContractDeployTransaction): Promise<string> {
    const restoredData = this._tryGetDataFromStorage(
      createKeyDeploymentFieldsHash({
        data: key.data,
        from: key.from!,
        chainId: key.chainId!,
        value: key.value!,
      }),
    );

    if (!isAddress(restoredData.contractAddress) || !(await isDeployedContractAddress(restoredData.contractAddress))) {
      throw new MigrateError(`Contract address is not valid`);
    }

    return restoredData.contractAddress;
  }

  @catchError
  public static async tryRestoreContractAddressByName(contractName: string): Promise<string> {
    const restoredData: ContractFieldsToSave = this._tryGetDataFromStorage(contractName);

    if (!isAddress(restoredData.contractAddress) || !(await isDeployedContractAddress(restoredData.contractAddress))) {
      throw new MigrateError(`Contract address is not valid`);
    }

    return restoredData.contractAddress;
  }

  @catchError
  @validateKeyTxFields
  public static tryRestoreSavedTransaction(key: KeyTransactionFields): TransactionFieldsToSave {
    return this._tryGetDataFromStorage(
      createKeyTxFieldsHash({
        data: key.data,
        from: key.from,
        chainId: key.chainId,
        to: key.to,
        value: key.value,
      }),
    );
  }

  @catchError
  private static _saveTransaction(
    args: KeyTransactionFields,
    transaction: TransactionReceiptParams,
    metadata: MigrationMetadata,
  ) {
    const dataToSave: TransactionFieldsToSave = {
      txKeyData: args,
      receipt: transaction,
      metadata,
    };

    const dataKey = createKeyTxFieldsHash({
      data: args.data,
      from: args.from,
      chainId: args.chainId,
      to: args.to,
      value: args.value,
    });

    if (TransactionStorage.has(dataKey)) {
      this._processCollision(dataKey, dataToSave);
    }

    TransactionStorage.set(dataKey, dataToSave, true);
  }

  private static _saveContract(args: ContractDeployTransaction, dataToSave: ContractFieldsToSave) {
    const keyByArgs = createKeyDeploymentFieldsHash({
      data: args.data,
      from: args.from!,
      chainId: args.chainId!,
      value: args.value!,
    });

    TransactionStorage.set(keyByArgs, dataToSave, true);
  }

  private static _saveContractByName(contractName: string, dataToSave: ContractFieldsToSave) {
    TransactionStorage.set(contractName, dataToSave, true);
  }

  private static _processCollision(dataKey: string, dataToSave: TransactionFieldsToSave | ContractFieldsToSave) {
    const oldData: {
      receipt?: TransactionReceiptParams;
      contractAddress?: string;
      metadata: MigrationMetadata;
    } = TransactionStorage.get(dataKey);

    if (oldData.contractAddress) {
      Reporter.notifyContractCollision(oldData as ContractFieldsToSave, dataToSave as ContractFieldsToSave);

      return;
    }

    if (oldData.receipt) {
      Reporter.notifyTransactionCollision(oldData as TransactionFieldsToSave, dataToSave as TransactionFieldsToSave);

      return;
    }

    Reporter.notifyUnknownCollision(oldData.metadata, dataToSave);
  }

  private static _tryGetDataFromStorage(key: string): any {
    const value = TransactionStorage.get(key);

    if (!value) {
      throw new MigrateError(`Requested data not found in storage`);
    }

    return value;
  }
}

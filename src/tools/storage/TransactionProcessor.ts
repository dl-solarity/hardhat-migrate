import { ContractDeployTransaction, isAddress, TransactionReceiptParams } from "ethers";

import { isFullyQualifiedName } from "hardhat/utils/contract-names";

import { TransactionStorage } from "./MigrateStorage";

import { reporter } from "../reporters/Reporter";

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
} from "../../types/tools";
import { MigrateConfig } from "../../types/migrations";
import { ContractDeployTxWithName } from "../../types/deployer";
import { validateKeyDeploymentFields, validateKeyTxFields } from "../../types/type-checks";

@catchError
export class TransactionProcessor {
  protected static _config: MigrateConfig;

  public static setConfig(config: MigrateConfig) {
    this._config = config;
  }

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
        name: contractName,
        data: args.data,
        from: args.from!,
        chainId: args.chainId!,
        value: args.value!,
      },
      contractAddress,
      metadata,
    };

    const keyByArgs = createKeyDeploymentFieldsHash(dataToSave.contractKeyData!);

    this._saveContract(keyByArgs, dataToSave);
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
  public static async tryRestoreContractAddressByKeyFields(key: ContractDeployTxWithName): Promise<string> {
    const restoredData = this._tryGetDataFromStorage(
      createKeyDeploymentFieldsHash({
        name: key.contractName,
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

  private static _saveContract(keyByArgs: string, dataToSave: ContractFieldsToSave) {
    if (TransactionStorage.has(keyByArgs)) {
      this._processCollision(keyByArgs, dataToSave);
    }

    TransactionStorage.set(keyByArgs, dataToSave, true);
  }

  private static _saveContractByName(contractName: string, dataToSave: ContractFieldsToSave) {
    if (TransactionStorage.has(contractName)) {
      this._processCollision(contractName, dataToSave);
    }

    TransactionStorage.set(contractName, dataToSave, true);
  }

  private static _processCollision(dataKey: string, dataToSave: TransactionFieldsToSave | ContractFieldsToSave) {
    if (this._config.continue) {
      return;
    }

    const oldData: {
      receipt?: TransactionReceiptParams;
      contractAddress?: string;
      metadata: MigrationMetadata;
    } = TransactionStorage.get(dataKey);

    if (oldData.contractAddress && isFullyQualifiedName(dataKey)) {
      reporter!.notifyContractCollisionByName(oldData as ContractFieldsToSave, dataToSave as ContractFieldsToSave);

      return;
    }

    if (oldData.contractAddress) {
      reporter!.notifyContractCollisionByKeyFields(oldData as ContractFieldsToSave, dataToSave as ContractFieldsToSave);

      return;
    }

    if (oldData.receipt) {
      reporter!.notifyTransactionCollision(oldData as TransactionFieldsToSave, dataToSave as TransactionFieldsToSave);

      return;
    }

    reporter!.notifyUnknownCollision(oldData.metadata, dataToSave);
  }

  private static _tryGetDataFromStorage(key: string): any {
    const value = TransactionStorage.get(key);

    if (!value) {
      throw new MigrateError(`Requested data not found in storage`);
    }

    return value;
  }
}

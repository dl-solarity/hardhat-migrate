import { ContractDeployTransaction, ContractTransaction, ContractTransactionResponse, isAddress } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { TransactionStorage } from "./MigrateStorage";

import { MigrateError } from "../../errors";

import {
  catchError,
  createKeyDeploymentFieldsHash,
  createKeyTxFieldsHash,
  isDeployedContractAddress,
} from "../../utils";

import { TruffleTransactionResponse } from "../../types/deployer";
import { validateKeyDeploymentFieldsFields, validateKeyTxFieldsFields } from "../../types/type-checks";

@catchError
export class TransactionProcessor {
  private static _deployedContracts: Map<string, boolean> = new Map();

  @validateKeyDeploymentFieldsFields
  public static saveDeploymentTransaction(args: ContractDeployTransaction, contractName: string, address: string) {
    this._saveContract(args, address);
    this._saveContractByName(contractName, address);
  }

  /**
   * @param tx - Transaction to save. Acts as a key and value at the same time.
   */
  public static saveTransaction(tx: ContractTransaction) {
    this._saveTransaction(
      {
        data: tx.data,
        from: tx.from!,
        chainId: tx.chainId!,
        to: tx.to,
      },
      tx,
    );
  }

  @validateKeyDeploymentFieldsFields
  public static async tryRestoreContractAddressByKeyFields(
    key: ContractDeployTransaction,
    hre: HardhatRuntimeEnvironment,
  ): Promise<string> {
    const contractAddress = this._tryGetDataFromStorage(
      createKeyDeploymentFieldsHash({
        data: key.data,
        from: key.from!,
        chainId: key.chainId!,
      }),
    );

    if (!isAddress(contractAddress) || !(await isDeployedContractAddress(hre, contractAddress))) {
      throw new MigrateError(`Contract address is not valid`);
    }

    return contractAddress;
  }

  public static async tryRestoreContractAddressByName(
    hre: HardhatRuntimeEnvironment,
    contractName: string,
  ): Promise<string> {
    const contractAddress = this._tryGetDataFromStorage(contractName);

    if (!isAddress(contractAddress) || !(await isDeployedContractAddress(hre, contractAddress))) {
      throw new MigrateError(`Contract address is not valid`);
    }

    return contractAddress;
  }

  @validateKeyTxFieldsFields
  public static tryRestoreSavedTransaction(key: ContractTransaction): ContractTransactionResponse {
    if (this._deployedContracts.has(key.to)) {
      throw new MigrateError(`Contract is deployed in the current migration`);
    }

    return this._tryGetDataFromStorage(
      createKeyTxFieldsHash({
        data: key.data,
        from: key.from!,
        chainId: key.chainId!,
        to: key.to,
      }),
    );
  }

  @validateKeyTxFieldsFields
  public static tryRecoverTruffleTransaction(key: ContractTransaction): TruffleTransactionResponse {
    if (this._deployedContracts.has(key.to)) {
      throw new MigrateError(`Contract is deployed in the current migration`);
    }

    return this._tryGetDataFromStorage(
      createKeyTxFieldsHash({
        data: key.data,
        from: key.from!,
        chainId: key.chainId!,
        to: key.to,
      }),
    );
  }

  private static _tryGetDataFromStorage(key: string): any {
    const value = TransactionStorage.get(key);

    if (!value) {
      throw new MigrateError(`Transaction not found in storage`);
    }

    return value;
  }

  @validateKeyTxFieldsFields
  private static _saveTransaction(args: ContractTransaction, transaction: ContractTransaction) {
    TransactionStorage.set(
      createKeyTxFieldsHash({
        data: args.data,
        from: args.from!,
        chainId: args.chainId!,
        to: args.to,
      }),
      transaction,
      true,
    );
  }

  @validateKeyDeploymentFieldsFields
  private static _saveContract(args: ContractDeployTransaction, contractAddress: string) {
    this._deployedContracts.set(contractAddress, true);

    TransactionStorage.set(
      createKeyDeploymentFieldsHash({
        data: args.data,
        from: args.from!,
        chainId: args.chainId!,
      }),
      contractAddress,
      true,
    );
  }

  private static _saveContractByName(contractName: string, address: string) {
    TransactionStorage.set(contractName, address, true);
  }
}

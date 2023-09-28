import { existsSync, readFileSync, writeFileSync } from "fs";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MigrateError } from "../../errors";

import { catchError, JSONConvertor, resolvePathToFile } from "../../utils";

import { KeyTxFields } from "../../types/transaction-storage";

@catchError
export class TransactionStorage {
  private static instance: TransactionStorage;

  private readonly _fileName = ".transaction_storage.json";

  private _filePath = "";
  private _state: Record<string, string> = {};
  private _hre: HardhatRuntimeEnvironment = {} as HardhatRuntimeEnvironment;

  private constructor() {}

  public static getInstance(): TransactionStorage {
    if (!TransactionStorage.instance) {
      TransactionStorage.instance = new TransactionStorage();
    }

    return TransactionStorage.instance;
  }

  public init(_hre: HardhatRuntimeEnvironment) {
    this._hre = _hre;

    this._filePath = resolvePathToFile(_hre.config.migrate.pathToMigrations, this._fileName);

    if (this._stateExistsInFile()) {
      this._state = this._readStateFromFile();
    } else {
      this.clear();
    }
  }

  public saveDeploymentTransaction(args: KeyTxFields, contractName: string, address: string) {
    this._saveDeploymentTransactionByTx(args, address);
    this._saveDeploymentTransactionByName(contractName, address);
  }

  public getDeploymentTransaction(args: KeyTxFields): string {
    const hash = this._createHash(args);

    const value = this._state[hash];

    if (!value) {
      throw new MigrateError(`Transaction not found in storage`);
    }

    return value;
  }

  public getDeploymentTransactionByName(contractName: string): string {
    const value = this._state[contractName];

    if (!value) {
      throw new MigrateError(`Transaction not found in storage`);
    }

    return value;
  }

  public clear() {
    this._state = {};

    this._saveStateToFile();
  }

  private _saveDeploymentTransactionByTx(args: KeyTxFields, address: string) {
    const hash = this._createHash(args);

    this._addValueToState(hash, address);
  }

  private _saveDeploymentTransactionByName(contractName: string, address: string) {
    this._addValueToState(contractName, address);
  }

  private _addValueToState(hash: string, address: string) {
    this._state[hash] = address;

    this._saveStateToFile();
  }

  private _createHash(keyTxFields: KeyTxFields): string {
    // TODO: rewrite
    const obj = { data: keyTxFields.data, from: keyTxFields.from, chaId: keyTxFields.chainId };

    return this._hre.ethers.id(this._toJSON(obj));
  }

  private _stateExistsInFile(): boolean {
    return existsSync(this._filePath);
  }

  private _saveStateToFile() {
    const fileContent = this._toJSON(this._state);

    writeFileSync(this._filePath, fileContent, {
      flag: "w",
      encoding: "utf8",
    });
  }

  private _readStateFromFile(): Record<string, string> {
    const fileContent = readFileSync(this._filePath, {
      encoding: "utf8",
    });

    return JSON.parse(fileContent);
  }

  private _toJSON(data: any): string {
    return JSON.stringify(data, JSONConvertor);
  }
}

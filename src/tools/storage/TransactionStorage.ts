import { id } from "ethers";
import { existsSync, readFileSync, writeFileSync } from "fs";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MigrateError } from "../../errors";

import { catchError, JSONConvertor, resolvePathToFile } from "../../utils";

import { ContractDeploymentTransactionInterestedValues } from "../../types/transaction-storage";

// TODO: add add this function to the TransactionStorage

//   public getContractName(instance: any): string {
//     const artifact = TemporaryStorage.getInstance().get(
//       bytecodeHash(bytecodeToString(this._getRawBytecode(instance))),
//     ) as ArtifactExtended;
//
//     if (!artifact) {
//       throw new MigrateError(`Contract name not found for instance: ${instance}`);
//       // TODO: change to warning
//     }
//
//     return `${artifact.sourceName}:${artifact.contractName}`;
//   }

@catchError
export class TransactionStorage {
  private static instance: TransactionStorage;

  private readonly _fileName = ".transaction_storage.json";
  private _filePath = "";
  private state: Record<string, string> = {};
  private _hre: HardhatRuntimeEnvironment = {} as HardhatRuntimeEnvironment;

  private constructor() {}

  // TODO: check code style. Let's move static methods to the top.
  public static getInstance(): TransactionStorage {
    if (!TransactionStorage.instance) {
      TransactionStorage.instance = new TransactionStorage();
    }

    return TransactionStorage.instance;
  }

  // TODO: maybe move this to the constructor?
  public init(_hre: HardhatRuntimeEnvironment) {
    this._hre = _hre;

    this._filePath = resolvePathToFile(_hre.config.migrate.pathToMigrations, this._fileName);

    if (this._stateExistsOnFile()) {
      this.state = this._readStateFromFile();
    } else {
      this.clear();
    }
  }

  public saveDeploymentTransaction(args: ContractDeploymentTransactionInterestedValues, address: string) {
    const hash = this._createHash(args);

    if (this.state[hash]) {
      if (this.state[hash] !== address) {
        // TODO: Let's do not throw error when it is possible to handle it or ignore.
        throw new MigrateError(`Transaction with hash ${hash} already exists in storage`);
      }

      return;
    }

    this._addValueToState(hash, address);
  }

  public saveDeploymentTransactionByName(contractName: string, address: string) {
    if (this.state[contractName]) {
      if (this.state[contractName] !== address) {
        throw new MigrateError(`Transaction with name ${contractName} already exists in storage`);
      }

      return;
    }

    this._addValueToState(contractName, address);
  }

  public getDeploymentTransaction(args: ContractDeploymentTransactionInterestedValues): string {
    const hash = this._createHash(args);

    // TODO: if value is not found throw error.

    return this.state[hash];
  }

  public getDeploymentTransactionByName(contractName: string): string {
    // TODO: throw an error if value is not found.

    return this.state[contractName];
  }

  public clear() {
    this.state = {};

    this._saveStateToFile();
  }

  private _addValueToState(hash: string, address: string) {
    this.state[hash] = address;

    this._saveStateToFile();
  }

  private _createHash(keyTxFields: ContractDeploymentTransactionInterestedValues): string {
    // TODO: let's use id from ethers everywhere where we need to hash strings
    return id(this._toJSON(keyTxFields));
  }

  private _stateExistsOnFile(): boolean {
    return existsSync(this._filePath);
  }

  private _saveStateToFile() {
    const fileContent = this._toJSON(this.state);

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

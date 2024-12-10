import {
  BaseContract,
  ContractMethodArgs,
  ContractTransaction,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  ethers,
  Interface,
} from "ethers";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter } from "./Adapter";

import { MinimalContract } from "../MinimalContract";

import { bytecodeToString, catchError, fillParameters, getInstanceNameFromClass, getMethodString } from "../../utils";

import { UNKNOWN_TRANSACTION_NAME } from "../../constants";

import { KeyTransactionFields, MigrationMetadata } from "../../types/tools";
import { EthersContract, Instance, TruffleFactory } from "../../types/adapter";
import { OverridesAndName, TruffleTransactionResponse } from "../../types/deployer";

import { Stats } from "../../tools/Stats";
import { Reporter } from "../../tools/reporters/Reporter";
import { networkManager } from "../../tools/network/NetworkManager";
import { TransactionRunner } from "../../tools/runners/TransactionRunner";
import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

@catchError
export class TruffleAdapter extends Adapter {
  public async fromInstance<A, I>(
    instance: EthersContract<A, I>,
    parameters: OverridesAndName,
  ): Promise<MinimalContract> {
    return new MinimalContract(
      this._hre,
      this.getRawBytecode(instance),
      this.getRawAbi(instance),
      this.getContractName(instance, parameters),
    );
  }

  public async toInstance<I>(instance: TruffleFactory<I>, address: string, _: OverridesAndName): Promise<I> {
    const contract = this._hre.artifacts.require(instance.contractName!);

    const contractInstance = await contract.at(address);
    (instance as any).setAsDeployed(contractInstance);

    this._insertHandlers(instance, contractInstance, address);

    return contractInstance;
  }

  public getInterface(instance: TruffleContract): Interface {
    return Interface.from(instance.abi);
  }

  public getRawAbi(instance: TruffleContract): string {
    return instance.abi;
  }

  public getRawBytecode(instance: TruffleContract): string {
    try {
      return bytecodeToString(instance.binary);
    } catch {
      return bytecodeToString(instance.bytecode);
    }
  }

  public getContractName<A, I>(instance: Instance<A, I>, parameters: OverridesAndName): string {
    if (parameters.name) {
      return parameters.name;
    }

    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      if ((instance as any)._hArtifact) {
        return this._getFullyQualifiedName(instance as any) || (instance as any).contractName;
      }

      return getInstanceNameFromClass(instance);
    }
  }

  protected _insertHandlers<I>(instance: TruffleFactory<I>, contract: I, address: string): I {
    const contractName = this.getContractName(instance, {});
    const ethersBaseContract: BaseContract = new BaseContract(address, this.getInterface(instance));

    for (const methodName of Object.keys((contract as any).contract.methods)) {
      if ((contract as any)[methodName] === undefined) {
        continue;
      }

      let functionStateMutability: string | undefined;
      try {
        functionStateMutability = ethersBaseContract.getFunction(methodName)?.fragment.stateMutability;
      } catch {
        // Ambiguous function description in ABI
        continue;
      }

      if (functionStateMutability === "view" || functionStateMutability === "pure") {
        continue;
      }

      (contract as any)[methodName] = this._wrapOldMethod(ethersBaseContract, contractName, methodName);
    }

    return contract;
  }

  protected _wrapOldMethod(
    ethersBaseContract: BaseContract,
    contractName: string,
    methodName: string,
  ): (...args: any[]) => Promise<TruffleTransactionResponse> {
    return async (...args: any[]): Promise<TruffleTransactionResponse> => {
      let contractMethod = ethersBaseContract.getFunction(methodName);

      // Build transaction. Under the hood, ethers handle overrides.
      // In Truffle to specify different signer the particular `{ from: 0x... }` override should be used.
      const tx = await contractMethod.populateTransaction(...args);

      // In case if the `from` field is not specified, it should be filled with the default signer.
      tx.from = tx.from ?? (await networkManager!.getSigner()).address;

      await fillParameters(tx);

      const keyFields = this._getKeyFieldsFromTransaction(tx, contractMethod, args);

      // Connect to signer and get method again with signer
      contractMethod = ethersBaseContract.connect(await networkManager!.getSigner(tx.from)).getFunction(methodName);

      const methodString = getMethodString(contractName, methodName, contractMethod.fragment, args);

      if (this._hre.config.migrate.continue) {
        return this._recoverTransaction(methodString, keyFields, contractMethod.send, args);
      }

      return this._sendTransaction(methodString, keyFields, contractMethod.send, args);
    };
  }

  protected async _recoverTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: (...args: ContractMethodArgs<any[]>) => Promise<ContractTransactionResponse>,
    args: any[],
  ): Promise<TruffleTransactionResponse> {
    try {
      const txResponse = TransactionProcessor?.tryRestoreSavedTransaction(tx);

      Reporter!.notifyTransactionRecovery(methodString);

      return txResponse as unknown as TruffleTransactionResponse;
    } catch {
      Reporter!.notifyTransactionSendingInsteadOfRecovery(methodString);

      return this._sendTransaction(methodString, tx, oldMethod, args);
    }
  }

  protected async _sendTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: (...args: ContractMethodArgs<any[]>) => Promise<ContractTransactionResponse>,
    args: any[],
  ): Promise<TruffleTransactionResponse> {
    const txResponse = await oldMethod(...args);

    const saveMetadata: MigrationMetadata = {
      migrationNumber: Stats.currentMigration,
      methodName: methodString,
    };

    await TransactionRunner!.reportTransactionResponse(txResponse, methodString);

    const response = this._toTruffleTransactionResponse((await txResponse.wait())!);
    TransactionProcessor?.saveTransaction(tx, response.receipt, saveMetadata);

    return response;
  }

  private _toTruffleTransactionResponse(receipt: ContractTransactionReceipt): TruffleTransactionResponse {
    return {
      tx: receipt.hash,
      receipt: {
        transactionHash: receipt.hash,
        transactionIndex: receipt.index.toString(),
        blockHash: receipt.blockHash,
        blockNumber: receipt.blockNumber.toString(),
        from: receipt.from,
        to: receipt.to ? receipt.to : ethers.ZeroAddress,
        gasUsed: receipt.gasUsed.toString(),
        logs: receipt.logs,
        logsBloom: receipt.logsBloom,
        type: receipt.type.toString(),
        status: receipt.status ? receipt.status.toString() : "",
        gasPrice: receipt.gasPrice.toString(),
        effectiveGasPrice: receipt.cumulativeGasUsed.toString(),
        cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
        contractAddress: receipt.contractAddress ? receipt.contractAddress : ethers.ZeroAddress,
      },
      logs: receipt.logs,
    };
  }

  private _getKeyFieldsFromTransaction(
    tx: ContractTransaction,
    contractMethod: ethers.ContractMethod<any[], any, any>,
    args: any[],
  ): KeyTransactionFields {
    return {
      data: tx.data,
      from: tx.from!,
      chainId: tx.chainId!,
      to: tx.to,
      value: tx.value!,
      name: this._getTransactionName(contractMethod, args),
    };
  }

  private _getTransactionName(contractMethod: ethers.ContractMethod<any[], any, any>, args: any[]): string {
    if (contractMethod.fragment.inputs.length + 1 === args.length) {
      return args[args.length - 1].txName || UNKNOWN_TRANSACTION_NAME;
    }

    return UNKNOWN_TRANSACTION_NAME;
  }

  private _getFullyQualifiedName(instance: any): string | undefined {
    if (!instance._hArtifact.sourceName || !instance._hArtifact.contractName) {
      return undefined;
    }

    return `${instance._hArtifact.sourceName}:${instance._hArtifact.contractName}`;
  }
}

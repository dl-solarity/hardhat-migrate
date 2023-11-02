import { Interface, toBigInt, TransactionReceiptParams } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter } from "./Adapter";

import { MinimalContract } from "../MinimalContract";

import { bytecodeToString, catchError, fillParameters, getMethodString } from "../../utils";

import { EthersContract, Instance, TruffleFactory } from "../../types/adapter";
import {
  BaseTruffleMethod,
  OverridesAndLibs,
  OverridesAndName,
  TruffleTransactionResponse,
} from "../../types/deployer";
import { KeyTransactionFields, MigrationMetadata, UNKNOWN_CONTRACT_NAME } from "../../types/tools";

import { Stats } from "../../tools/Stats";
import { Reporter } from "../../tools/reporters/Reporter";
import { TruffleReporter } from "../../tools/reporters/TruffleReporter";
import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

@catchError
export class TruffleAdapter extends Adapter {
  constructor(private _hre: HardhatRuntimeEnvironment) {
    super(_hre.config.migrate);
  }

  public async fromInstance<A, I>(
    instance: EthersContract<A, I>,
    parameters: OverridesAndName,
  ): Promise<MinimalContract> {
    return new MinimalContract(
      this._config,
      this.getRawBytecode(instance),
      this.getRawAbi(instance),
      this.getContractName(instance, parameters),
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async toInstance<I>(instance: TruffleFactory<I>, address: string, _: OverridesAndName): Promise<I> {
    const contract = this._hre.artifacts.require(instance.contractName!);

    await this._overrideConnectMethod(contract);

    const contractInstance = await contract.at(address);
    (instance as any).setAsDeployed(contractInstance);

    return contractInstance;
  }

  public getInterface(instance: TruffleContract): Interface {
    return Interface.from(instance.abi);
  }

  public getRawAbi(instance: TruffleContract): string {
    return instance.abi;
  }

  public getRawBytecode(instance: TruffleContract): string {
    return bytecodeToString(instance.bytecode);
  }

  public getContractName<A, I>(instance: Instance<A, I>, parameters: OverridesAndName): string {
    if (parameters.name) {
      return parameters.name;
    }

    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      if ((instance as any).contractName) {
        return (instance as any).contractName;
      }

      return UNKNOWN_CONTRACT_NAME;
    }
  }

  protected async _overrideConnectMethod<I>(instance: TruffleFactory<I>) {
    const atMethod = instance.at;

    instance.at = async (address: string): Promise<I> => {
      const contract = await atMethod(address);

      return this._insertHandlers(instance, contract, address, {});
    };
  }

  protected _insertHandlers<I>(instance: TruffleFactory<I>, contract: I, to: string, parameters: OverridesAndLibs): I {
    const contractInterface = this.getInterface(instance);
    const contractName = this.getContractName(instance, parameters);

    for (const methodName of Object.keys((contract as any).contract.methods)) {
      const oldMethod: BaseTruffleMethod = (contract as any)[methodName];

      let functionStateMutability: string | undefined;
      try {
        functionStateMutability = contractInterface.getFunction(methodName)?.stateMutability;
      } catch {
        // Ambiguous function description in ABI
        continue;
      }

      if (functionStateMutability === "view" || functionStateMutability === "pure") {
        continue;
      }

      if (oldMethod === undefined) {
        continue;
      }

      (contract as any)[methodName] = this._wrapOldMethod(
        contractInterface,
        contractName,
        methodName,
        oldMethod,
        to,
        parameters,
      );
    }

    return contract;
  }

  protected _wrapOldMethod(
    contractInterface: Interface,
    contractName: string,
    methodName: string,
    oldMethod: BaseTruffleMethod,
    to: string,
    parameters: OverridesAndLibs,
  ): (...args: any[]) => Promise<TruffleTransactionResponse> {
    return async (...args: any[]): Promise<TruffleTransactionResponse> => {
      const methodString = getMethodString(contractName, methodName);

      const txData = contractInterface.encodeFunctionData(methodName, args);
      const onlyToSaveTx = await this._buildContractDeployTransaction(txData, to, parameters);

      if (this._config.continue) {
        return this._recoverTransaction(methodString, onlyToSaveTx, oldMethod, args);
      }

      TruffleReporter.notifyTransactionSending(methodString);

      const txResult = await oldMethod(...args);

      const saveMetadata: MigrationMetadata = {
        migrationNumber: Stats.currentMigration,
        methodName: methodString,
      };

      TransactionProcessor.saveTransaction(onlyToSaveTx, this._toTransactionReceipt(txResult), saveMetadata);

      await TruffleReporter.reportTransaction(txResult, methodString);

      return txResult;
    };
  }

  protected async _recoverTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: BaseTruffleMethod,
    args: any[],
  ) {
    try {
      const txResponse = TransactionProcessor.tryRestoreSavedTransaction(tx);

      Reporter.notifyTransactionRecovery(methodString);

      return txResponse as unknown as TruffleTransactionResponse;
    } catch {
      Reporter.notifyTransactionSendingInsteadOfRecovery(methodString);

      return this._sendTransaction(methodString, tx, oldMethod, args);
    }
  }

  protected async _sendTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: BaseTruffleMethod,
    args: any[],
  ) {
    const txResult = await oldMethod(...args);

    const saveMetadata: MigrationMetadata = {
      migrationNumber: Stats.currentMigration,
      methodName: methodString,
    };

    TransactionProcessor.saveTransaction(tx, this._toTransactionReceipt(txResult), saveMetadata);

    await TruffleReporter.reportTransaction(txResult, methodString);

    return txResult;
  }

  /**
   * @dev Build a transaction ONLY to save it in the storage.
   */
  private async _buildContractDeployTransaction(
    data: string,
    to: string,
    parameters: OverridesAndLibs,
  ): Promise<KeyTransactionFields> {
    await fillParameters(parameters);

    return {
      to: to,
      from: parameters.from! as string,
      data: data,
      chainId: toBigInt(String(parameters.chainId)),
      value: toBigInt(String(parameters.value)),
    };
  }

  private _toTransactionReceipt(tx: TruffleTransactionResponse): TransactionReceiptParams {
    let txGasPrice: bigint = 0n;

    if (tx.receipt.effectiveGasPrice != null) {
      txGasPrice = toBigInt(tx.receipt.effectiveGasPrice);
    } else if (tx.receipt.gasPrice != null) {
      txGasPrice = toBigInt(tx.receipt.gasPrice);
    }

    return {
      to: tx.receipt.to,
      from: tx.receipt.from,
      contractAddress: tx.receipt.contractAddress !== undefined ? tx.receipt.contractAddress : null,
      hash: tx.receipt.transactionHash,
      index: Number(tx.receipt.transactionIndex),
      blockHash: tx.receipt.blockHash,
      blockNumber: Number(tx.receipt.blockNumber),
      logsBloom: tx.receipt.logsBloom ? tx.receipt.logsBloom : "",
      logs: tx.logs !== undefined ? tx.logs : [],
      gasUsed: tx.receipt.gasUsed ? toBigInt(tx.receipt.gasUsed) : 0n,
      cumulativeGasUsed: tx.receipt.cumulativeGasUsed ? toBigInt(tx.receipt.cumulativeGasUsed) : 0n,
      gasPrice: txGasPrice,
      type: tx.receipt.type ? Number(tx.receipt.type) : 0,
      status: tx.receipt.status ? Number(tx.receipt.status) : null,
      root: null,
    };
  }
}

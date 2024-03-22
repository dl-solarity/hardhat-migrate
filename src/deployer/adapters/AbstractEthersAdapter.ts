import {
  BaseContract,
  BaseContractMethod,
  ContractFactory,
  ContractRunner,
  ContractTransaction,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  defineProperties,
  FunctionFragment,
  Interface,
} from "ethers";

import { Adapter } from "./Adapter";
import { MinimalContract } from "../MinimalContract";

import "../../type-extensions";

import { UNKNOWN_TRANSACTION_NAME } from "../../constants";

import { bytecodeToString, fillParameters, getMethodString, getSignerHelper } from "../../utils";

import { OverridesAndLibs, OverridesAndName } from "../../types/deployer";
import { EthersContract, BytecodeFactory } from "../../types/adapter";
import { KeyTransactionFields, MigrationMetadata, TransactionFieldsToSave } from "../../types/tools";

import { Stats } from "../../tools/Stats";
import { Reporter } from "../../tools/reporters/Reporter";
import { TransactionRunner } from "../../tools/runners/TransactionRunner";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

type Factory<A, I> = EthersContract<A, I> | BytecodeFactory | ContractFactory;

export abstract class AbstractEthersAdapter extends Adapter {
  public getRawBytecode<A, I>(instance: Factory<A, I>): string {
    return bytecodeToString(instance.bytecode);
  }

  public async fromInstance<A, I>(instance: Factory<A, I>, parameters: OverridesAndName): Promise<MinimalContract> {
    return new MinimalContract(
      this._hre,
      this.getRawBytecode(instance),
      this.getRawAbi(instance),
      this.getContractName(instance, parameters),
    );
  }

  public async toInstance<A, I>(instance: Factory<A, I>, address: string, parameters: OverridesAndLibs): Promise<I> {
    const signer = await getSignerHelper(parameters.from);
    const contractName = this.getContractName(instance, parameters);

    let contract = new BaseContract(address, this.getInterface(instance), signer);

    contract = this._insertAddressGetter(contract, address);
    contract = await this._overrideConnectMethod(contract, this.getInterface(instance), contractName);

    return this._insertHandlers(contract, contractName) as unknown as I;
  }

  protected _insertHandlers(contract: BaseContract, contractName: string): BaseContract {
    const methodSet = new Set<string>();

    for (const methodFragments of this._getContractFunctionFragments(contract.interface)) {
      if (methodFragments.stateMutability === "view" || methodFragments.stateMutability === "pure") {
        continue;
      }

      const methodName = methodFragments.format();
      const shortName = methodName.split("(")[0];

      const oldMethod: BaseContractMethod = (contract as any)[methodName];

      const newMethod = this._wrapOldMethod(contractName, methodName, methodFragments, oldMethod, contract.runner!);

      defineProperties<any>(newMethod, {
        name: oldMethod.name,
        getFragment: oldMethod.getFragment,
        estimateGas: oldMethod.estimateGas,
        populateTransaction: oldMethod.populateTransaction,
        send: oldMethod.send,
        staticCall: oldMethod.staticCall,
        staticCallResult: oldMethod.staticCallResult,
      });
      Object.defineProperty(newMethod, "fragment", oldMethod.fragment);

      (contract as any)[methodName] = newMethod;

      if (!methodSet.has(shortName)) {
        (contract as any)[shortName] = newMethod;

        methodSet.add(shortName);
      } else {
        (contract as any)[shortName] = undefined;
      }
    }

    return contract;
  }

  protected async _overrideConnectMethod(
    contract: BaseContract,
    contractInterface: Interface,
    contractName: string,
  ): Promise<BaseContract> {
    const defaultRunner = await getSignerHelper();

    contract.connect = (runner: ContractRunner | null): BaseContract => {
      const newContract = new BaseContract(contract.target, contractInterface, runner ?? defaultRunner);

      return this._insertHandlers(newContract, contractName) as any;
    };

    return contract;
  }

  private _insertAddressGetter(contract: BaseContract, contractAddress: string): BaseContract {
    (contract as any).address = contractAddress;

    return contract;
  }

  private _getContractFunctionFragments(contractInterface: Interface): FunctionFragment[] {
    const result: FunctionFragment[] = [];

    contractInterface.forEachFunction((fragment) => {
      result.push(fragment);
    });

    return result;
  }

  private _wrapOldMethod(
    contractName: string,
    methodName: string,
    methodFragments: FunctionFragment,
    oldMethod: BaseContractMethod,
    runner: ContractRunner,
  ): (...args: any[]) => Promise<ContractTransactionResponse> {
    return async (...args: any[]): Promise<ContractTransactionResponse> => {
      const tx = await oldMethod.populateTransaction(...args);
      tx.from = (runner as any).address;

      await fillParameters(tx);

      const methodString = getMethodString(contractName, methodName, methodFragments, args);

      const keyFields = this._getKeyFieldsFromTransaction(tx);

      if (this._hre.config.migrate.continue) {
        return this._recoverTransaction(methodString, keyFields, oldMethod, args);
      }

      return this._sendTransaction(methodString, keyFields, oldMethod, args);
    };
  }

  private async _recoverTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: BaseContractMethod,
    args: any[],
  ) {
    try {
      const savedTransaction = TransactionProcessor?.tryRestoreSavedTransaction(tx);

      Reporter!.notifyTransactionRecovery(methodString);

      return this._wrapTransactionFieldsToSave(savedTransaction!);
    } catch {
      Reporter!.notifyTransactionSendingInsteadOfRecovery(methodString);

      return this._sendTransaction(methodString, tx, oldMethod, args);
    }
  }

  private async _sendTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: BaseContractMethod,
    args: any[],
  ) {
    const txResponse: ContractTransactionResponse = (await oldMethod(...args)) as ContractTransactionResponse;

    const saveMetadata: MigrationMetadata = {
      migrationNumber: Stats.currentMigration,
      methodName: methodString,
    };

    await TransactionRunner!.reportTransactionResponse(txResponse, methodString);

    TransactionProcessor?.saveTransaction(tx, (await txResponse.wait())!, saveMetadata);

    return txResponse;
  }

  private _wrapTransactionFieldsToSave(data: TransactionFieldsToSave): ContractTransactionResponse {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      wait(_confirms?: number): Promise<ContractTransactionReceipt | null> {
        return data.receipt as unknown as Promise<ContractTransactionReceipt | null>;
      },
    } as unknown as ContractTransactionResponse;
  }

  private _getKeyFieldsFromTransaction(tx: ContractTransaction): KeyTransactionFields {
    return {
      name: this._getTransactionName(tx),
      data: tx.data,
      from: tx.from!,
      chainId: tx.chainId!,
      value: tx.value!,
      to: tx.to,
    };
  }

  private _getTransactionName(tx: ContractTransaction): string {
    if (tx.customData === undefined || tx.customData.txName === undefined) {
      return UNKNOWN_TRANSACTION_NAME;
    }

    return tx.customData.txName;
  }
}

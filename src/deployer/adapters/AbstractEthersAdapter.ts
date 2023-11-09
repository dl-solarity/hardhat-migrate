import {
  BaseContract,
  BaseContractMethod,
  ContractFactory,
  ContractTransactionReceipt,
  ContractTransactionResponse,
  defineProperties,
  FunctionFragment,
  Interface,
} from "ethers";

import { Adapter } from "./Adapter";
import { MinimalContract } from "../MinimalContract";

import "../../type-extensions";

import { bytecodeToString, fillParameters, getMethodString, getSignerHelper } from "../../utils";

import { OverridesAndLibs, OverridesAndName } from "../../types/deployer";
import { EthersContract, BytecodeFactory } from "../../types/adapter";
import { KeyTransactionFields, MigrationMetadata, TransactionFieldsToSave } from "../../types/tools";

import { Stats } from "../../tools/Stats";
import { Reporter } from "../../tools/reporters/Reporter";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

type Factory<A, I> = EthersContract<A, I> | BytecodeFactory | ContractFactory;

export abstract class AbstractEthersAdapter extends Adapter {
  private static _processedClasses = new Set<string>();

  public getRawBytecode<A, I>(instance: Factory<A, I>): string {
    return bytecodeToString(instance.bytecode);
  }

  public async fromInstance<A, I>(instance: Factory<A, I>, parameters: OverridesAndName): Promise<MinimalContract> {
    return new MinimalContract(
      this._config,
      this.getRawBytecode(instance),
      this.getRawAbi(instance),
      this.getContractName(instance, parameters),
    );
  }

  public async toInstance<A, I>(instance: Factory<A, I>, address: string, parameters: OverridesAndLibs): Promise<I> {
    const signer = await getSignerHelper(parameters.from);

    const contract = new BaseContract(address, this.getInterface(instance), signer);

    const contractName = this.getContractName(instance, parameters);

    if (!AbstractEthersAdapter._processedClasses.has(contractName)) {
      AbstractEthersAdapter._processedClasses.add(contractName);

      await this._overrideConnectMethod(instance, contractName);
    }

    this._insertAddressGetter(contract, address);
    return this._insertHandlers(contract, contractName, parameters) as unknown as I;
  }

  protected _insertHandlers(contract: BaseContract, contractName: string, parameters: OverridesAndLibs): BaseContract {
    const methodSet = new Set<string>();

    for (const methodFragments of this._getContractFunctionFragments(contract.interface)) {
      if (methodFragments.stateMutability === "view" || methodFragments.stateMutability === "pure") {
        continue;
      }

      const methodName = methodFragments.format();
      const shortName = methodName.split("(")[0];

      const oldMethod: BaseContractMethod = (contract as any)[methodName];

      const newMethod = this._wrapOldMethod(contractName, methodName, methodFragments, oldMethod, parameters);

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

  protected abstract _overrideConnectMethod<A, I>(instance: Factory<A, I>, contractName: string): Promise<void>;

  private _insertAddressGetter(contract: BaseContract, contractAddress: string): void {
    contract.address = contractAddress;
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
    parameters: OverridesAndLibs,
  ): (...args: any[]) => Promise<ContractTransactionResponse> {
    return async (...args: any[]): Promise<ContractTransactionResponse> => {
      await fillParameters(parameters);
      const tx = (await oldMethod.populateTransaction(...args, parameters)) as KeyTransactionFields;

      const methodString = getMethodString(contractName, methodName, methodFragments, args);

      if (this._config.continue) {
        return this._recoverTransaction(methodString, tx, oldMethod, args);
      } else {
        return this._sendTransaction(methodString, tx, oldMethod, args);
      }
    };
  }

  private async _recoverTransaction(
    methodString: string,
    tx: KeyTransactionFields,
    oldMethod: BaseContractMethod,
    args: any[],
  ) {
    try {
      const savedTransaction = TransactionProcessor.tryRestoreSavedTransaction(tx);

      Reporter.notifyTransactionRecovery(methodString);

      return this._wrapTransactionFieldsToSave(savedTransaction);
    } catch {
      Reporter.notifyTransactionSendingInsteadOfRecovery(methodString);

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

    TransactionProcessor.saveTransaction(tx, (await txResponse.wait())!, saveMetadata);

    await Reporter.reportTransactionResponse(txResponse, methodString);

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
}

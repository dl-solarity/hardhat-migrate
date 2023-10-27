import {
  BaseContract,
  BaseContractMethod,
  ContractFactory,
  ContractTransactionResponse,
  defineProperties,
  FunctionFragment,
  Interface,
} from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Adapter } from "./Adapter";

import { bytecodeToString, fillParameters, getMethodString, getSignerHelper } from "../../utils";

import { EthersFactory, PureFactory } from "../../types/adapter";
import { OverridesAndLibs } from "../../types/deployer";

import { Reporter } from "../../tools/reporters/Reporter";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";
import { KeyTransactionFields } from "../../types/tools";
import { MinimalContract } from "../MinimalContract";

type Factory<A, I> = EthersFactory<A, I> | PureFactory | ContractFactory;

export abstract class AbstractEthersAdapter extends Adapter {
  private static _processedClasses = new Set<string>();

  constructor(_hre: HardhatRuntimeEnvironment) {
    super(_hre);
  }

  public getRawBytecode<A, I>(instance: Factory<A, I>): string {
    return bytecodeToString(instance.bytecode);
  }

  public async fromInstance<A, I>(instance: Factory<A, I>): Promise<MinimalContract> {
    return new MinimalContract(
      this._hre,
      this.getRawBytecode(instance),
      this.getInterface(instance),
      this.getContractName(instance),
    );
  }

  public async toInstance<A, I>(instance: Factory<A, I>, address: string, parameters: OverridesAndLibs): Promise<I> {
    const signer = await getSignerHelper(this._hre, parameters.from);

    const contract = new BaseContract(address, this.getInterface(instance), signer);

    const contractName = this.getContractName(instance);

    if (!AbstractEthersAdapter._processedClasses.has(contractName)) {
      AbstractEthersAdapter._processedClasses.add(contractName);

      this.overrideConnectMethod(instance, contractName);
    }

    return this.insertHandlers(contract, contractName, parameters) as unknown as I;
  }

  public insertHandlers(contract: BaseContract, contractName: string, parameters: OverridesAndLibs): BaseContract {
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

  public abstract overrideConnectMethod<A, I>(instance: Factory<A, I>, contractName: string): Promise<void>;

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
      await fillParameters(this._hre, parameters);
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
      const txResponse = TransactionProcessor.tryRestoreSavedTransaction(tx);

      Reporter.notifyTransactionRecovery(methodString);

      return txResponse;
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

    TransactionProcessor.saveTransaction(tx);

    await Reporter.reportTransaction(txResponse, methodString);

    return txResponse;
  }
}

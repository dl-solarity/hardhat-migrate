import {
  defineProperties,
  Signer,
  Interface,
  BaseContract,
  FunctionFragment,
  BaseContractMethod,
  ContractTransactionResponse,
  ContractTransaction,
} from "ethers";

import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { EthersFactory } from "../../types/adapter";

import { Reporter } from "../../tools/reporter/Reporter";
import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

@catchError
export class EthersAdapter extends Adapter {
  public async toInstance<A, I>(instance: EthersFactory<A, I>, address: string, signer: Signer): Promise<I> {
    const contract = new BaseContract(address, this._getInterface(instance), signer) as unknown as I;

    return this._insertHandlers(instance, contract);
  }

  protected _getInterface<A, I>(instance: EthersFactory<A, I>): Interface {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode<A, I>(instance: EthersFactory<A, I>): string {
    return bytecodeToString(instance.bytecode);
  }

  protected _insertHandlers<A, I>(instance: EthersFactory<A, I>, contract: I): I {
    const contractName = ArtifactProcessor.getContractName(this._getRawBytecode(instance)).split(":")[1];

    for (const methodFragments of this._getContractMethods(instance)) {
      const methodName = methodFragments.format();

      const oldMethod: BaseContractMethod = (contract as any)[methodName];

      const newMethod = this._wrapOldMethod(contractName, methodName, methodFragments, oldMethod);

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
    }

    return contract;
  }

  protected _wrapOldMethod(
    contractName: string,
    methodName: string,
    methodFragments: FunctionFragment,
    oldMethod: BaseContractMethod,
  ): (...args: any[]) => Promise<ContractTransactionResponse> {
    return async (...args: any[]): Promise<ContractTransactionResponse> => {
      const tx = await oldMethod.populateTransaction(...args);

      const methodString = this._getMethodString(contractName, methodName, methodFragments, ...args);

      if (this._config.continuePreviousDeployment) {
        return this._recoverTransaction(methodString, tx, oldMethod, args);
      } else {
        return this._sendTransaction(methodString, tx, oldMethod, args);
      }
    };
  }

  protected async _recoverTransaction(
    methodString: string,
    tx: ContractTransaction,
    oldMethod: BaseContractMethod,
    args: any[],
  ) {
    try {
      return this._tryRecoverTransaction(methodString, tx);
    } catch {
      Reporter.notifyTransactionSendingInsteadOfRecovery(methodString);

      return this._sendTransaction(methodString, tx, oldMethod, args);
    }
  }

  protected async _tryRecoverTransaction(methodString: string, tx: ContractTransaction) {
    const txResponse = TransactionProcessor.tryRestoreSavedTransaction(tx);

    Reporter.notifyTransactionRecovery(methodString);

    return txResponse;
  }

  protected async _sendTransaction(
    methodString: string,
    tx: ContractTransaction,
    oldMethod: BaseContractMethod,
    args: any[],
  ) {
    const txResponse: ContractTransactionResponse = (await oldMethod(...args)) as ContractTransactionResponse;

    TransactionProcessor.saveTransaction(tx);

    await Reporter.reportTransaction(txResponse, methodString);

    return txResponse;
  }
}

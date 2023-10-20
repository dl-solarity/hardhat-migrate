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

import { bytecodeToString, catchError, getChainId } from "../../utils";

import { EthersFactory } from "../../types/adapter";

import { Reporter } from "../../tools/reporter/Reporter";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";

@catchError
export class EthersAdapter extends Adapter {
  public async toInstance<A, I>(instance: EthersFactory<A, I>, address: string, signer: Signer): Promise<I> {
    const contract = new BaseContract(address, this._getInterface(instance), signer) as unknown as I;

    return this._insertHandlers(instance, contract, await signer.getAddress(), address);
  }

  protected _getInterface<A, I>(instance: EthersFactory<A, I>): Interface {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode<A, I>(instance: EthersFactory<A, I>): string {
    return bytecodeToString(instance.bytecode);
  }

  protected _insertHandlers<A, I>(instance: EthersFactory<A, I>, contract: I, from: string, to: string): I {
    const contractName = this.tryGetContractName(instance);

    for (const methodFragments of this._getContractMethods(instance)) {
      if (methodFragments.stateMutability === "view") {
        continue;
      }

      const methodName = methodFragments.format();
      const shortName = methodName.split("(")[0];

      const oldMethod: BaseContractMethod = (contract as any)[methodName];

      let isMethodSet: boolean = false;
      if (((contract as any)[shortName] as any).isSet) {
        (contract as any)[shortName] = undefined;

        isMethodSet = true;
      }

      const newMethod = this._wrapOldMethod(contractName, methodName, methodFragments, oldMethod, from, to);

      defineProperties<any>(newMethod, {
        name: oldMethod.name,
        getFragment: oldMethod.getFragment,
        estimateGas: oldMethod.estimateGas,
        populateTransaction: oldMethod.populateTransaction,
        send: oldMethod.send,
        staticCall: oldMethod.staticCall,
        staticCallResult: oldMethod.staticCallResult,
        isSet: true,
      });
      Object.defineProperty(newMethod, "fragment", oldMethod.fragment);

      (contract as any)[methodName] = newMethod;

      if (!isMethodSet) {
        (contract as any)[shortName] = newMethod;
      }
    }

    return contract;
  }

  protected _wrapOldMethod(
    contractName: string,
    methodName: string,
    methodFragments: FunctionFragment,
    oldMethod: BaseContractMethod,
    from: string,
    to: string,
  ): (...args: any[]) => Promise<ContractTransactionResponse> {
    return async (...args: any[]): Promise<ContractTransactionResponse> => {
      const tx = await oldMethod.populateTransaction(...args);
      tx.from = from;
      tx.to = to;
      tx.chainId = await getChainId(this._hre);

      const methodString = this._getMethodString(contractName, methodName, methodFragments, ...args);

      if (this._config.continue) {
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
      return await this._tryRecoverTransaction(methodString, tx);
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

  protected _getMethodString(
    contractName: string,
    methodName: string,
    methodFragment: FunctionFragment,
    ...args: any[]
  ): string {
    let argsString = "";

    for (let i = 0; i < args.length; i++) {
      argsString += `${methodFragment.inputs[i].name}:${args[i]}${i === args.length - 1 ? "" : ", "}`;
    }

    return `${contractName}.${methodName}(${argsString})`;
  }
}

import {
  BaseContract,
  BaseContractMethod,
  ContractTransactionResponse,
  defineProperties,
  Fragment,
  FunctionFragment,
  Interface,
  Signer,
} from "ethers";

import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { EthersFactory } from "../../types/adapter";

import { Reporter } from "../../tools/reporter/Reporter";
import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { TransactionProcessor } from "../../tools/storage/TransactionProcessor";
import { Args } from "../../types/deployer";

@catchError
export class EthersAdapter extends Adapter {
  public toInstance<A, I>(instance: EthersFactory<A, I>, address: string, signer: Signer, tryRestore = false): I {
    const contract = new BaseContract(address, this._getABI(instance), signer) as unknown as I;

    return this._insertHandlers(instance, contract, tryRestore);
  }

  public async sendTransaction(
    instance: BaseContract,
    method: string,
    args: Args,
  ): Promise<ContractTransactionResponse> {
    return this.wrapOldMethod(
      "",
      method,
      (instance as any).getFunction(method),
      (instance as any)[method],
      false,
    )(...args);
  }

  protected _getABI<A, I>(instance: EthersFactory<A, I>): Interface {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode<A, I>(instance: EthersFactory<A, I>): string {
    return bytecodeToString(instance.bytecode);
  }

  private _getContractMethods<A, I>(instance: EthersFactory<A, I>): FunctionFragment[] {
    const fragments = (instance.createInterface() as unknown as Interface).fragments;

    return fragments.filter(Fragment.isFunction).filter((fragment) => !fragment.constant);
  }

  private _insertHandlers<A, I>(instance: EthersFactory<A, I>, contract: I, tryRestore: boolean): I {
    const contractName = ArtifactProcessor.getContractName(this._getRawBytecode(instance)).split(":")[1];

    for (const methodFragments of this._getContractMethods(instance)) {
      const methodName = methodFragments.format();

      const oldMethod: BaseContractMethod = (contract as any)[methodName];

      const newMethod = this.wrapOldMethod(contractName, methodName, methodFragments, oldMethod, tryRestore);

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

  private wrapOldMethod(
    contractName: string,
    methodName: string,
    methodFragments: FunctionFragment,
    oldMethod: BaseContractMethod,
    tryRestore: boolean,
  ): (...args: any[]) => Promise<ContractTransactionResponse> {
    return async (...args: any[]): Promise<ContractTransactionResponse> => {
      const tx = await oldMethod.populateTransaction(...args);

      let argsString = "";
      for (let i = 0; i < args.length; i++) {
        argsString += `${methodFragments.inputs[i].name}:${args[i]}${i === args.length - 1 ? "" : ", "}`;
      }
      const methodString = `${contractName}.${methodName}(${argsString})`;

      if (tryRestore) {
        try {
          const txResponse = TransactionProcessor.tryRestoreSavedTransaction(tx);

          Reporter.notifyTransactionRecovery(methodString);

          return txResponse;
        } catch {
          Reporter.notifyTransactionSendingInsteadOfRecovery(methodString);

          const res: ContractTransactionResponse = await oldMethod(...args);

          TransactionProcessor.saveTransaction(tx);

          await Reporter.reportTransaction(res, methodString);

          return res;
        }
      } else {
        const res: ContractTransactionResponse = await oldMethod(...args);

        TransactionProcessor.saveTransaction(tx);

        await Reporter.reportTransaction(res, methodString);

        return res;
      }
    };
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
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

import { Reporter } from "../../tools/reporter/Reporter";
import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { EthersFactory } from "../../types/adapter";

@catchError
export class EthersAdapter extends Adapter {
  public toInstance<A, I>(instance: EthersFactory<A, I>, address: string, signer: Signer): I {
    const contract = new BaseContract(address, this._getABI(instance), signer) as unknown as I;

    return this._insertHandlers(instance, contract);
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

  private _insertHandlers<A, I>(instance: EthersFactory<A, I>, contract: I): I {
    const contractName = ArtifactProcessor.getContractName(this._getRawBytecode(instance)).split(":")[1];

    for (const method of this._getContractMethods(instance)) {
      const methodName = method.name;

      const oldMethod: BaseContractMethod = (contract as any)[methodName];

      const newMethod = async (...args: any[]) => {
        const res = await oldMethod(...args);

        let argsString = "";
        for (let i = 0; i < args.length; i++) {
          argsString += `${method.inputs[i].name}:${args[i]}${i === args.length - 1 ? "" : ", "}`;
        }
        const methodString = `${contractName}.${methodName}(${argsString})`;

        await Reporter.getInstance().reportTransaction(res as unknown as ContractTransactionResponse, methodString);

        return res;
      };

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
}

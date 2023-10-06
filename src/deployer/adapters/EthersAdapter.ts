import { BaseContract, BaseContractMethod, Interface, Signer } from "ethers";

import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { EthersFactory } from "../../types/adapter";

@catchError
export class EthersAdapter extends Adapter {
  public toInstance<A, I>(instance: EthersFactory<A, I>, address: string, signer: Signer): I {
    const contract = new BaseContract(address, this._getABI(instance), signer) as unknown as I;

    const fragments = (instance.createInterface() as unknown as Interface).fragments;

    const methods = fragments.filter((fragment) => fragment.type === "function") as unknown as BaseContractMethod[];

    for (const method of methods) {
      const methodName = method.name;

      const oldMethod: BaseContractMethod = (contract as any)[methodName];
      // [Symbol.toPrimitive]
      (contract as any)[methodName] = async (...args: any[]) => {
        console.log(`Calling ${methodName} with args: ${args}`);

        const res = await oldMethod(...args);

        return res;
      };
    }

    return contract;
  }

  protected _getABI<A, I>(instance: EthersFactory<A, I>): Interface {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode<A, I>(instance: EthersFactory<A, I>): string {
    return bytecodeToString(instance.bytecode);
  }
}

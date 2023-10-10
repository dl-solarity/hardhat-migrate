import { BaseContract, BaseContractMethod, Interface, Signer } from "ethers";

import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { EthersFactory } from "../../types/adapter";

@catchError
export class EthersAdapter extends Adapter {
  // I like this idea a lot. In this case, we do not need sender at all.
  // As we can integrate reporter and storage module into methods
  // As we will support truffle, we will need a separate method
  // TODO: clean up the file.
  // 1. toInstance as method is overloaded with functionality
  // 2. Use separate functions for each functionality
  // 3. Focus on scalability (e.g., if we have a new module A, this module must be easily integrated into each method of the Contract)
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

        return oldMethod(...args);
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

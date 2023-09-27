import { ContractFactory, Interface, Signer } from "ethers";

import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { EthersFactory } from "../../types/adapter";

@catchError
export class EthersAdapter extends Adapter {
  public toInstance<A, I>(instance: EthersFactory<A, I>, address: string, signer: Signer): I {
    if (instance instanceof ContractFactory) {
      return instance.attach(address);
    }

    return instance.connect(address, signer);
  }

  protected _getABI<A, I>(instance: EthersFactory<A, I>): Interface {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode<A, I>(instance: EthersFactory<A, I>): string {
    return bytecodeToString(instance.bytecode);
  }
}

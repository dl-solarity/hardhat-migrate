import { BaseContract, Interface, Signer } from "ethers";

import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { EthersFactory } from "../../types/adapter";

@catchError
export class EthersAdapter extends Adapter {
  public toInstance<A, I>(instance: EthersFactory<A, I>, address: string, signer: Signer): I {
    return new BaseContract(address, this._getABI(instance), signer) as unknown as I;
  }

  protected _getABI<A, I>(instance: EthersFactory<A, I>): Interface {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode<A, I>(instance: EthersFactory<A, I>): string {
    return bytecodeToString(instance.bytecode);
  }
}

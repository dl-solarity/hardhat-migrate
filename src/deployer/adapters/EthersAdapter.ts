import { Signer } from "ethers";

import { Adapter, EthersFactory } from "../../types/adapter";
import { Abi } from "../../types/deployer";

import { catchError } from "../../utils";

export class EthersAdapter extends Adapter {
  @catchError
  public linkLibrary(library: any, instance: any): void {
    // TODO: Implement
  }

  @catchError
  public toInstance<A, I>(instance: EthersFactory<A, I>, address: string, signer?: Signer | null): I {
    return instance.connect(address, signer);
  }

  @catchError
  protected _getABI<A, I>(instance: EthersFactory<A, I>): Abi {
    return instance.abi;
  }

  @catchError
  protected _getBytecode<A, I>(instance: EthersFactory<A, I>): string {
    return instance.bytecode;
  }
}

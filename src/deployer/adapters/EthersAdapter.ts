import { ContractFactory, Interface, Signer } from "ethers";

import { Adapter, EthersFactory } from "../../types/adapter";
import { Abi, Bytecode } from "../../types/deployer";

import { catchError } from "../../utils";

@catchError
export class EthersAdapter extends Adapter {
  // eslint-disable-next-line
  public linkLibrary(library: any, instance: any): void {
    // this._hre.ethers.link(library, instance);
  }

  public toInstance<A, I>(instance: EthersFactory<A, I>, address: string, signer: Signer): I {
    if (instance instanceof ContractFactory) {
      return instance.attach(address);
    }
    return instance.connect(address, signer);
  }

  protected _getABI<A, I>(instance: EthersFactory<A, I>): Abi {
    if (instance.abi) {
      return Interface.from(instance.abi);
    }

    return (instance as any).interface;
  }

  protected _getBytecode<A, I>(instance: EthersFactory<A, I>): Bytecode {
    const bytecode = instance.bytecode;
    // if bytecode contains link references, throw an error
    if (bytecode.indexOf("__") !== -1) {
      (instance as any).linkBytecode();
    }
    return instance.bytecode;
  }

  protected _getRawBytecode<A, I>(instance: EthersFactory<A, I>): Bytecode {
    return instance.bytecode;
  }
}

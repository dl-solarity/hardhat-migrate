import { ContractFactory, Interface, Signer } from "ethers";
import { MigrateError } from "../../errors";

import { Adapter, EthersFactory } from "../../types/adapter";
import { Abi, Bytecode } from "../../types/deployer";

import { catchError } from "../../utils";

@catchError
export class EthersAdapter extends Adapter {
  public async linkLibrary(): Promise<string> {
    throw new MigrateError("Method has deprecated. Use deploy() instead");
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

  protected _getRawBytecode<A, I>(instance: EthersFactory<A, I>): Bytecode {
    return { object: instance.bytecode };
  }
}

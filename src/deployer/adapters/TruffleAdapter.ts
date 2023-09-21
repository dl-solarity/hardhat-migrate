import { Interface } from "ethers";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter, TruffleFactory } from "../../types/adapter";
import { Abi, Bytecode } from "../../types/deployer";

import { catchError } from "../../utils";

@catchError
export class TruffleAdapter extends Adapter {
  public async linkLibrary(library: TruffleContract, ...instances: TruffleContract): Promise<void> {
    library = library.contractName ? await library.deployed() : library;

    for (const instance of instances) {
      instance.link(library);
    }
  }

  public toInstance<I>(instance: TruffleFactory<I>, address: string): I {
    const contract = this._hre.artifacts.require(instance.contractName!);

    return contract.at(address);
  }

  protected _getABI(instance: TruffleContract): Abi {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode(instance: TruffleContract): Bytecode {
    return instance.bytecode;
  }
}

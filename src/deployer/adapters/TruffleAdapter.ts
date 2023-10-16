import { Interface } from "ethers";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { MigrateError } from "../../errors";
import { TruffleFactory } from "../../types/adapter";
import { Abi } from "../../types/deployer";

@catchError
export class TruffleAdapter extends Adapter {
  public async link(library: TruffleContract, ...instances: TruffleContract): Promise<void> {
    library = library.contractName ? await library.deployed() : library;

    for (const instance of instances) {
      instance.link(library);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async sendTransaction(instance: any, method: string, args: any[]): Promise<any> {
    throw new MigrateError("PureAdapter does not support sendTransaction.");
  }

  public toInstance<I>(instance: TruffleFactory<I>, address: string): I {
    const contract = this._hre.artifacts.require(instance.contractName!);

    return contract.at(address);
  }

  protected _getABI(instance: TruffleContract): Abi {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode(instance: TruffleContract): string {
    return bytecodeToString(instance.bytecode);
  }
}

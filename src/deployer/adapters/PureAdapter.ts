import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { Abi } from "../../types/deployer";
import { PureFactory } from "../../types/adapter";

// TODO: think about BaseContract usage here.

@catchError
export class PureAdapter extends Adapter {
  public toInstance<I>(instance: any, address: string): I {
    if (typeof instance.contractName !== "string") {
      throw new Error("ContractName must be a string.");
    }

    return address as unknown as I;
  }

  protected _getABI<I>(instance: PureFactory<I>): Abi {
    return instance.abi;
  }

  protected _getRawBytecode<I>(instance: PureFactory<I>): string {
    return bytecodeToString(instance.bytecode);
  }
}

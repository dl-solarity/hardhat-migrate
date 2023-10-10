import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { PureFactory } from "../../types/adapter";
import { Abi } from "../../types/deployer";

@catchError
export class PureAdapter extends Adapter {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

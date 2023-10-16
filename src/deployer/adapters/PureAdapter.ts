import { Adapter } from "./Adapter";

import { bytecodeToString, catchError } from "../../utils";

import { MigrateError } from "../../errors";
import { PureFactory } from "../../types/adapter";
import { Abi } from "../../types/deployer";

// TODO: think about BaseContract usage here.

@catchError
export class PureAdapter extends Adapter {
  public toInstance<I>(instance: any, address: string): I {
    if (typeof instance.contractName !== "string") {
      throw new Error("ContractName must be a string.");
    }

    return address as unknown as I;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async sendTransaction(instance: any, method: string, args: any[]): Promise<any> {
    throw new MigrateError("PureAdapter does not support sendTransaction.");
  }

  protected _getABI<I>(instance: PureFactory<I>): Abi {
    return instance.abi;
  }

  protected _getRawBytecode<I>(instance: PureFactory<I>): string {
    return bytecodeToString(instance.bytecode);
  }
}

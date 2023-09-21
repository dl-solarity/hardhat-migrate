import { catchError } from "../../utils";

import { Abi, Bytecode } from "../../types/deployer";
import { Adapter, PureFactory } from "../../types/adapter";

@catchError
export class PureAdapter extends Adapter {
  public toInstance<I>(instance: PureFactory<I>, address: string): I {
    return address as I;
  }

  protected _getABI<A, I>(instance: PureFactory<I>): Abi {
    return instance.abi;
  }

  protected _getRawBytecode<A, I>(instance: PureFactory<I>): Bytecode {
    return instance.bytecode;
  }
}

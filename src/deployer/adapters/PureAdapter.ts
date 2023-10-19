import { Interface, Signer } from "ethers";

import { Adapter } from "./Adapter";
import { EthersAdapter } from "./EthersAdapter";

import { bytecodeToString, catchError } from "../../utils";

import { PureFactory } from "../../types/adapter";

@catchError
export class PureAdapter extends Adapter {
  public async toInstance(instance: PureFactory, address: string, signer: Signer): Promise<any> {
    return (await new EthersAdapter(this._hre).toInstance(instance as any, address, signer)) as unknown as any;
  }

  protected _getInterface(instance: PureFactory): Interface {
    return Interface.from(instance.abi);
  }

  protected _getRawBytecode(instance: PureFactory): string {
    return bytecodeToString(instance.bytecode);
  }
}

import { ContractFactory, Interface, Signer } from "ethers";

import { Adapter } from "./Adapter";
import { EthersAdapter } from "./EthersAdapter";

import { catchError } from "../../utils";

import { defineProperty } from "../../types/adapter";

@catchError
export class PureEthersAdapter extends Adapter {
  public async toInstance(instance: ContractFactory, address: string, signer: Signer): Promise<any> {
    this._makeCompatibleWithEthersAdapter(instance);
    return (await new EthersAdapter(this._hre).toInstance(instance as any, address, signer)) as unknown as any;
  }

  protected _getInterface(instance: ContractFactory): Interface {
    return instance.interface;
  }

  protected _getRawBytecode(instance: ContractFactory): string {
    return instance.bytecode;
  }

  private _makeCompatibleWithEthersAdapter(instance: ContractFactory): any {
    defineProperty(instance, "abi", {
      get: function () {
        return JSON.parse(instance.interface.formatJson());
      },
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(instance, Symbol.iterator, {
      value: function* () {
        for (const item of instance.abi) {
          yield item;
        }
      },
      enumerable: false,
      configurable: true,
    });
  }
}

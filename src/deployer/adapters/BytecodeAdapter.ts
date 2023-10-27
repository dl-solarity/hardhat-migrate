import { Interface } from "ethers";

import { AbstractEthersAdapter } from "./AbstractEthersAdapter";

import { catchError } from "../../utils";

import { PureFactory } from "../../types/adapter";

@catchError
export class BytecodeAdapter extends AbstractEthersAdapter {
  public getInterface(instance: PureFactory): Interface {
    return Interface.from(instance.abi);
  }

  public getContractName(instance: PureFactory): string {
    return instance.contractName;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async overrideConnectMethod(_instance: PureFactory, _contractName: string) {
    return;
  }
}

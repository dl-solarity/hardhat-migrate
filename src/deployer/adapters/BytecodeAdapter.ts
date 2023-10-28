import { Interface } from "ethers";

import { AbstractEthersAdapter } from "./AbstractEthersAdapter";

import { catchError } from "../../utils";

import { BytecodeFactory } from "../../types/adapter";

@catchError
export class BytecodeAdapter extends AbstractEthersAdapter {
  public getInterface(instance: BytecodeFactory): Interface {
    return Interface.from(instance.abi);
  }

  public getContractName(instance: BytecodeFactory): string {
    return instance.contractName;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async overrideConnectMethod(_instance: BytecodeFactory, _contractName: string) {
    return;
  }
}

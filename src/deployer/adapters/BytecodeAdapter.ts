import { Interface } from "ethers";

import { AbstractEthersAdapter } from "./AbstractEthersAdapter";

import { catchError } from "../../utils";

import { BytecodeFactory } from "../../types/adapter";

@catchError
export class BytecodeAdapter extends AbstractEthersAdapter {
  public getInterface(instance: BytecodeFactory): Interface {
    return Interface.from(instance.abi);
  }

  public getRawAbi(instance: BytecodeFactory): string {
    return instance.abi as string;
  }

  public getContractName(instance: BytecodeFactory): string {
    return instance.contractName;
  }
}

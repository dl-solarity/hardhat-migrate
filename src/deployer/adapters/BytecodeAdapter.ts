import { Interface } from "ethers";

import { BaseAdapter } from "./BaseAdapter";

import { catchError } from "../../utils";

import { BytecodeFactory } from "../../types/adapter";

@catchError
export class BytecodeAdapter extends BaseAdapter {
  public getInterface(instance: BytecodeFactory): Interface {
    return Interface.from(instance.abi);
  }

  public getContractName(instance: BytecodeFactory): string {
    return instance.contractName;
  }
}

import { Interface } from "ethers";

import { BaseAdapter } from "./BaseAdapter.js";

import { CatchClassError } from "../../utils/index.js";

import type { BytecodeFactory } from "../../../types/adapter.js";

@CatchClassError
export class BytecodeAdapter extends BaseAdapter {
  public getInterface(instance: BytecodeFactory): Interface {
    return Interface.from(instance.abi);
  }

  public getContractName(instance: BytecodeFactory): string {
    return instance.contractName;
  }
}

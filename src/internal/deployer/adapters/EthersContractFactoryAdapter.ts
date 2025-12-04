import { ContractFactory, Interface } from "ethers";

import { BaseAdapter } from "./BaseAdapter.js";

import { CatchClassError, getInstanceNameFromClass } from "../../utils/index.js";

import type { OverridesAndName } from "../../../types/deployer.js";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor.js";

@CatchClassError
export class EthersContractFactoryAdapter extends BaseAdapter {
  public getInterface(instance: ContractFactory): Interface {
    return instance.interface;
  }

  public getContractName(instance: ContractFactory, parameters: OverridesAndName): string {
    if (parameters.name) {
      return parameters.name;
    }

    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      if ((instance as any).contractName) {
        return (instance as any).contractName;
      }

      return getInstanceNameFromClass(instance);
    }
  }
}

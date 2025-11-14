import { Interface } from "ethers";

import { BaseAdapter } from "./BaseAdapter.js";

import { CatchClassError, getInstanceNameFromClass } from "../../utils/index.js";

import type { OverridesAndName } from "../../../types/deployer.js";
import type { TypechainFactoryClass } from "../../../types/adapter.js";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor.js";

@CatchClassError
export class TypechainContractFactoryAdapter extends BaseAdapter {
  public getInterface<A, I>(instance: TypechainFactoryClass<A, I>): Interface {
    return Interface.from(instance.abi);
  }

  public getContractName<A, I>(instance: TypechainFactoryClass<A, I>, parameters: OverridesAndName): string {
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

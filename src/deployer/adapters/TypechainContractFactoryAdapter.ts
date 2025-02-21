import { Interface } from "ethers";

import { BaseAdapter } from "./BaseAdapter";

import { catchError, getInstanceNameFromClass } from "../../utils";

import { OverridesAndName } from "../../types/deployer";
import { TypechainFactoryClass } from "../../types/adapter";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";

@catchError
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

import { ContractFactory, Interface } from "ethers";

import { BaseAdapter } from "./BaseAdapter";

import { catchError, getInstanceNameFromClass } from "../../utils";

import { OverridesAndName } from "../../types/deployer";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";

@catchError
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

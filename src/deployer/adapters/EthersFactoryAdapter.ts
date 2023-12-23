import { Addressable, ContractFactory, Interface } from "ethers";

import { AbstractEthersAdapter } from "./AbstractEthersAdapter";

import { OverridesAndName } from "../../types/deployer";

import { catchError } from "../../utils";

import { UNKNOWN_CONTRACT_NAME } from "../../constants";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";

@catchError
export class EthersFactoryAdapter extends AbstractEthersAdapter {
  public getInterface(instance: ContractFactory): Interface {
    return instance.interface;
  }

  public getRawAbi(instance: ContractFactory): string {
    return JSON.stringify(instance.interface.fragments);
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

      return UNKNOWN_CONTRACT_NAME;
    }
  }

  protected async _overrideConnectMethod(instance: ContractFactory, contractName: string) {
    const attachMethod = instance.attach;

    instance.attach = (target: string | Addressable): any => {
      const contract = attachMethod(target);

      return this._insertHandlers(contract, contractName);
    };
  }
}

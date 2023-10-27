import { Addressable, ContractFactory, Interface } from "ethers";

import { AbstractEthersAdapter } from "./AbstractEthersAdapter";

import { catchError } from "../../utils";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";

@catchError
export class PureEthersAdapter extends AbstractEthersAdapter {
  public getInterface(instance: ContractFactory): Interface {
    return instance.interface;
  }

  public getContractName(instance: ContractFactory): string {
    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      return "Unknown Contract";
    }
  }

  public async overrideConnectMethod(instance: ContractFactory, contractName: string) {
    const attachMethod = instance.attach;

    instance.attach = (target: string | Addressable): any => {
      const contract = attachMethod(target);

      return this.insertHandlers(contract, contractName, {});
    };
  }
}

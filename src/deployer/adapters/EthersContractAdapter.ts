import { BaseContract, ContractRunner, Interface } from "ethers";

import { AbstractEthersAdapter } from "./AbstractEthersAdapter";

import { catchError, getSignerHelper } from "../../utils";

import { EthersContract } from "../../types/adapter";
import { OverridesAndName } from "../../types/deployer";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";

@catchError
export class EthersContractAdapter extends AbstractEthersAdapter {
  public getInterface<A, I>(instance: EthersContract<A, I>): Interface {
    return Interface.from(instance.abi);
  }

  public getRawAbi<A, I>(instance: EthersContract<A, I>): string {
    return instance.abi;
  }

  public getContractName<A, I>(instance: EthersContract<A, I>, parameters: OverridesAndName): string {
    if (parameters.name) {
      return parameters.name;
    }

    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      if ((instance as any).contractName) {
        return (instance as any).contractName;
      }

      return "Unknown Contract";
    }
  }

  protected async _overrideConnectMethod<A, I>(instance: EthersContract<A, I>, contractName: string) {
    const connectMethod = instance.connect;

    const defaultRunner = await getSignerHelper();

    instance.connect = (address: string, runner?: ContractRunner): I => {
      const contract = connectMethod(address, runner ?? defaultRunner) as BaseContract;

      return this._insertHandlers(contract, contractName, {}) as unknown as I;
    };
  }
}

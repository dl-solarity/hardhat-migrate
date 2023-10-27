import { BaseContract, ContractRunner, Interface } from "ethers";

import { catchError, getSignerHelper } from "../../utils";

import { EthersFactory } from "../../types/adapter";

import { ArtifactProcessor } from "../../tools/storage/ArtifactProcessor";
import { AbstractEthersAdapter } from "./AbstractEthersAdapter";

@catchError
export class EthersAdapter extends AbstractEthersAdapter {
  public getInterface<A, I>(instance: EthersFactory<A, I>): Interface {
    return Interface.from(instance.abi);
  }

  public getContractName<A, I>(instance: EthersFactory<A, I>): string {
    try {
      return ArtifactProcessor.tryGetContractName(this.getRawBytecode(instance));
    } catch {
      return "Unknown Contract";
    }
  }

  public async overrideConnectMethod<A, I>(instance: EthersFactory<A, I>, contractName: string) {
    const connectMethod = instance.connect;

    const defaultRunner = await getSignerHelper(this._hre);

    instance.connect = (address: string, runner?: ContractRunner): I => {
      const contract = connectMethod(address, runner ?? defaultRunner) as BaseContract;

      return this.insertHandlers(contract, contractName, {}) as unknown as I;
    };
  }
}

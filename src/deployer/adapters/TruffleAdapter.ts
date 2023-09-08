import { Signer } from "ethers";

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter, TruffleFactory } from "../../types/adapter";
import { Abi, TruffleDeployParams } from "../../types/deployer";

import { catchError } from "../../utils";

export class TruffleAdapter extends Adapter {
  @catchError
  public linkLibrary(library: TruffleContract, instance: TruffleContract): void {
    instance.link(library);
  }

  @catchError
  public override getContractDeployParams(instance: any): TruffleDeployParams {
    return { ...super.getContractDeployParams(instance), contractName: instance.contractName };
  }

  @catchError
  public toInstance<A, I>(instance: TruffleFactory<I>, address: string, signer?: Signer | null): I {
    const contract = this._hre.artifacts.require(instance.contractName!);

    return contract.at(address);
  }

  @catchError
  protected _getABI(instance: TruffleContract): Abi {
    return instance.abi;
  }

  @catchError
  protected _getBytecode(instance: TruffleContract): string {
    return instance.bytecode;
  }
}

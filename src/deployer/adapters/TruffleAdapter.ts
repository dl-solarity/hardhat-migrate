import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";
import { Interface } from "ethers";

import { Adapter, TruffleFactory } from "../../types/adapter";
import { Abi, TruffleDeployParams } from "../../types/deployer";

import { catchError } from "../../utils";

@catchError
export class TruffleAdapter extends Adapter {
  public linkLibrary(library: TruffleContract, instance: TruffleContract): void {
    instance.link(library);
  }

  // eslint-disable-next-line
  public override getContractDeployParams(instance: any): TruffleDeployParams {
    return { ...super.getContractDeployParams(instance), contractName: instance.contractName };
  }

  public toInstance<I>(instance: TruffleFactory<I>, address: string): I {
    const contract = this._hre.artifacts.require(instance.contractName!);

    return contract.at(address);
  }

  protected _getABI(instance: TruffleContract): Abi {
    return Interface.from(instance.abi);
  }

  protected _getBytecode(instance: TruffleContract): string {
    return instance.bytecode;
  }
}

import("@nomiclabs/hardhat-truffle5");

import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";

import { Adapter } from "../../types/adapter";
import { Abi, TruffleDeployParams } from "../../types/deployer";

export class TruffleAdapter extends Adapter {
  public override getContractDeployParams(instance: any): TruffleDeployParams {
    return { ...super.getContractDeployParams(instance), contractName: instance.contractName };
  }

  public async toInstance(address: string, params: TruffleDeployParams): Promise<TruffleContract> {
    const Contract = this._hre.artifacts.require(params.contractName!);

    return Contract.at(address);
  }

  protected _getABI(instance: TruffleContract): Abi {
    return instance.abi;
  }

  protected _getBytecode(instance: TruffleContract): string {
    return instance.bytecode;
  }
}

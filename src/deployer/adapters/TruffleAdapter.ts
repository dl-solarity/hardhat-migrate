import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";
import { MigrateError } from "../../errors";
import { Adapter } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

export class TruffleAdapter extends Adapter {
  public override getContractDeployParams(instance: any): ContractDeployParams {
    return {
      abi: this._getABI(instance),
      bytecode: this._getBytecode(instance),
      contractName: instance.contractName,
    };
  }
  protected _getABI(instance: TruffleContract): Abi {
    return instance.abi;
  }

  protected _getBytecode(instance: TruffleContract): string {
    return instance.bytecode;
  }

  public async toInstance(address: string, params: ContractDeployParams): Promise<TruffleContract> {
    import("@nomiclabs/hardhat-truffle5");

    const Contract = this._hre.artifacts.require(params.contractName!!);

    return Contract.at(address);
    // throw new MigrateError("Not implemented");
  }
}

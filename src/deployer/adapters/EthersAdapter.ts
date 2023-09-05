import { BaseContract, ContractFactory } from "ethers";

import { Adapter } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

export class EthersAdapter extends Adapter {
  public toInstance(address: string, params: ContractDeployParams): BaseContract {
    return new BaseContract(address, params.abi, this._hre.ethers.provider);
  }

  protected _getABI(instance: ContractFactory): Abi {
    return instance.interface.formatJson();
  }

  protected _getBytecode(instance: ContractFactory): string {
    return instance.bytecode;
  }
}

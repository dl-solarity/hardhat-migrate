import { BaseContract } from "ethers";

import { Adapter } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

export class ContractNameAdapter extends Adapter {
  public toInstance(address: string, params: ContractDeployParams): BaseContract {
    return new BaseContract(address, params.abi);
  }

  protected _getABI(contractName: string): Abi {
    return this.getArtifact(contractName).abi as Abi;
  }

  protected _getBytecode(contractName: string): string {
    return this.getArtifact(contractName).bytecode;
  }
}

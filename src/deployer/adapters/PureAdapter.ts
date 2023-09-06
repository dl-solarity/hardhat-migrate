import { BaseContract } from "ethers";
import { Adapter } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

export class PureAdapter extends Adapter {
  public toInstance(address: string, params: ContractDeployParams): any {
    return address;
  }

  protected _getABI(obj: { abi: any[] }): Abi {
    return obj.abi;
  }

  protected _getBytecode(obj: { bytecode: string }): string {
    return obj.bytecode;
  }
}

import { BaseContract } from "ethers";
import { Adapter } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

export class PureAdapter extends Adapter {
  protected _getABI(obj: { abi: any[] }): Abi {
    return obj.abi;
  }

  protected _getBytecode(obj: { bytecode: string }): string {
    return obj.bytecode;
  }

  toInstance(address: string, abi: Abi): any {
    return address;
  }
}

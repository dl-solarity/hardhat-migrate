import { BaseContract, ContractTransactionResponse } from "ethers";
import { Adapter } from "../../types/adapter";
import { abi } from "../../types/deployer";

export class PureAdapter implements Adapter {
  public getABI(obj: { abi: any[] }): abi {
    return obj.abi;
  }

  public getByteCode(obj: { bytecode: string }): string {
    return obj.bytecode;
  }

  toInstance(contract: BaseContract) {
    return contract.getAddress();
  }
}

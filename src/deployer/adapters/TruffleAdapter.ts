import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";
import { BaseContract } from "ethers";
import { Adapter } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

export class TruffleAdapter extends Adapter {
  protected _getABI(instance: TruffleContract): Abi {
    return instance.abi;
  }

  protected _getBytecode(instance: TruffleContract): string {
    return instance.bytecode;
  }

  public toInstance(address: string, abi: Abi): any {
    return address;
  }
}

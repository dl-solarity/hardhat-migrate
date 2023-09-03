import { TruffleContract } from "@nomiclabs/hardhat-truffle5/dist/src/types";
import { BaseContract, ContractTransactionResponse } from "ethers";
import { Adapter } from "../../types/adapter";
import { abi } from "../../types/deployer";

export class TruffleAdapter implements Adapter {
  public getABI(instance: TruffleContract): abi {
    return instance.abi;
  }

  public getByteCode(instance: TruffleContract): string {
    return instance.bytecode;
  }

  toInstance(contract: BaseContract) {
    return contract.getAddress();
  }
}

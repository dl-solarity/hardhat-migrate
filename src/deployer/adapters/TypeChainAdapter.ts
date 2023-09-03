import { BaseContract, ContractTransactionResponse } from "ethers";
import { Contract } from "typechain";
import { MigrateError } from "../../errors";
import { Adapter } from "../../types/adapter";
import { abi } from "../../types/deployer";

export class TypeChainAdapter implements Adapter {
  public getABI(instance: Contract): abi {
    throw new MigrateError("Method not implemented.");
  }

  public getByteCode(instance: Contract): string {
    throw new MigrateError("Method not implemented.");
  }

  toInstance(contract: BaseContract) {
    return contract.getAddress();
  }
}

import { BaseContract } from "ethers";
import { Contract } from "typechain";
import { MigrateError } from "../../errors";
import { Adapter } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

export class TypeChainAdapter extends Adapter {
  protected _getABI(instance: Contract): Abi {
    throw new MigrateError("Method not implemented.");
  }

  protected _getBytecode(instance: Contract): string {
    throw new MigrateError("Method not implemented.");
  }

  public toInstance(address: string, abi: Abi): any {
    return address;
  }
}

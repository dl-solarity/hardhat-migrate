import { BaseContract, ContractFactory } from "ethers";
import { MigrateError } from "../../errors";
import { Adapter } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

export class EthersAdapter extends Adapter {
  public toInstance(address: string, abi: Abi): BaseContract {
    return new BaseContract(address, abi);
  }

  protected _getABI(instance: ContractFactory): Abi {
    return instance.interface.formatJson();
  }

  protected _getBytecode(instance: ContractFactory): string {
    return instance.bytecode;
  }
}

import { BaseContract, Contract, ContractFactory, ContractTransactionResponse } from "ethers";
import { MigrateError } from "../../errors";
import { Adapter } from "../../types/adapter";
import { abi } from "../../types/deployer";

export class EthersAdapter implements Adapter {
  public getABI(instance: BaseContract): abi {
    return instance.interface.fragments;
  }

  public getByteCode(instance: BaseContract): string {
    throw new MigrateError("Method not implemented.");
  }

  public getABIFactory(instance: ContractFactory): abi {
    return instance.interface.formatJson();
  }

  public getByteCodeFactory(instance: ContractFactory): string {
    throw new MigrateError("Method not implemented.");
  }

  toInstance(contract: BaseContract) {
    return contract.getAddress();
  }
}

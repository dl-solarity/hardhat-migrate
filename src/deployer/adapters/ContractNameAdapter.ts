import { BaseContract, ContractFactory } from "ethers";
import { Artifact, HardhatRuntimeEnvironment } from "hardhat/types";
import { MigrateError } from "../../errors";
import { Adapter } from "../../types/adapter";
import { Abi, ContractDeployParams } from "../../types/deployer";

export class ContractNameAdapter extends Adapter {
  public toInstance(address: string, abi: Abi): BaseContract {
    return new BaseContract(address, abi);
  }

  protected _getABI(contractName: string): Abi {
    return this.getArtifact(contractName).abi as Abi;
  }

  protected _getBytecode(contractName: string): string {
    return this.getArtifact(contractName).bytecode;
  }
}

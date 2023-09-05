import { Deployer } from "../../../../src/deployer/Deployer";
import { ContractWithConstructorArgumentsContract, ContractWithConstructorArgumentsInstance } from "../typechain-types";

export = async (deployer: Deployer) => {
  let contract: ContractWithConstructorArgumentsInstance;

  contract = await deployer.deploy("ContractWithConstructorArguments", ["hello"], {
    gasLimit: 1000000,
  });

  contract = await deployer.deploy2<ContractWithConstructorArgumentsContract>(["hello"], {
    gasLimit: 1000000,
  });

  contract.name();
};

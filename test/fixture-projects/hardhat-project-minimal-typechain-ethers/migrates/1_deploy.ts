import { Deployer } from "../../../../src/deployer/Deployer";

import { ContractWithConstructorArguments } from "../typechain-types";

export = async (deployer: Deployer) => {
  let contract: ContractWithConstructorArguments;

  contract = await deployer.deploy("ContractWithConstructorArguments", ["hello"], {
    gasLimit: 1000000,
  });

  contract = await deployer.deploy2<ContractWithConstructorArguments>([contract], {
    gasLimit: 1000000,
  });

  contract.name();
};

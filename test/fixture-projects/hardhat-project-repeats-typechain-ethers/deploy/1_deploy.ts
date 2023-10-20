import { Deployer } from "../../../../src/deployer/Deployer";

import { ContractWithConstructorArguments__factory } from "../typechain-types";

export = async (deployer: Deployer) => {
  let contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"], {
    gasLimit: 1000000,
  });

  await contract.name();
};

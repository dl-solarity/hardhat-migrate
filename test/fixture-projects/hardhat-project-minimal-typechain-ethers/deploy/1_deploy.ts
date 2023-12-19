import { Deployer } from "../../../../src/deployer/Deployer";

import { ContractWithConstructorArguments__factory } from "../typechain-types";

export = async (deployer: Deployer) => {
  let contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"], {
    gasLimit: 1000000,
  });

  let contract2 = await deployer.deploy({ bytecode: "", abi: "", contractName: "" }, ["hello"], {});

  await contract.name();
};

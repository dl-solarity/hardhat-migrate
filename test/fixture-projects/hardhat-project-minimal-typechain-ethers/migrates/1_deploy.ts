import { Deployer } from "../../../../src/deployer/Deployer";
import { Migrator } from "../../../../src/migrator/migrator";

import { ContractWithConstructorArguments__factory } from "../typechain-types";

export = async (deployer: Deployer) => {
  let contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"], {
    gasLimit: 1000000,
  });

  let contract2 = await deployer.deploy({ bytecode: "", abi: "", contractName: "" }, ["hello"], {});

  contract.name;
};
// let contract = await deployer.deploy(ContractWithConstructorArguments__factory, ["hello"], {
//   gasLimit: 1000000,
// });

// let contract2 = await deployer.deploy({ bytecode: "", abi: "", contractName: "" }, ["hello"], {});

// contract.name;

import { getContractFactory } from "@nomicfoundation/hardhat-ethers/types";

import { Deployer } from "../../../../src/deployer/Deployer";

export = async (deployer: Deployer) => {
  const ContractWithConstructorArguments = await getContractFactory("ContractWithConstructorArguments");

  let contract = await deployer.deploy(ContractWithConstructorArguments, ["hello"], {
    gasLimit: 1000000,
  });

  await contract.name();
};

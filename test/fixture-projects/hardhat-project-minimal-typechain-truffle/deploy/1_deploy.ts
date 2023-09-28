import { Deployer } from "../../../../src/deployer/Deployer";

const ContractWithConstructorArguments = artifacts.require("ContractWithConstructorArguments");

export = async (deployer: Deployer) => {
  // let contract = await deployer.deploy(ContractWithConstructorArguments, ["hello"], {
  //   gasLimit: 1000000,
  // });
  // await contract.name();
};

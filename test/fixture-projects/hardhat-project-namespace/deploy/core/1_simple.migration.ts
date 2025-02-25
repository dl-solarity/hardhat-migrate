import { Deployer } from "../../../../../src/deployer/Deployer";

import { GovToken__factory } from "../../typechain-types";

export = async (deployer: Deployer) => {
  await deployer.deploy(GovToken__factory, ["Token", "TKN"]);
};

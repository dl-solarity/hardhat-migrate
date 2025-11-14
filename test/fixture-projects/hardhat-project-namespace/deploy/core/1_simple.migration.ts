import { Deployer } from "../../../../../src/internal/deployer/Deployer.js";

import { GovToken__factory } from "../../typechain-types/index.js";

export default async (deployer: Deployer) => {
  await deployer.deploy(GovToken__factory, ["Token", "TKN"]);
};

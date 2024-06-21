import { Deployer } from "../../../../src/deployer/Deployer";

import { GovToken__factory } from "../typechain-types";

export = async (deployer: Deployer) => {
  await deployer.setSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

  await deployer.deploy(GovToken__factory, ["Token", "TKN"], { name: "Governance Token #12" });

  const govToken5 = await deployer.deployed(GovToken__factory, "Governance Token #12");

  if ((await govToken5.owner()) !== "0x70997970C51812dc3A010C7d01b50e0d17dc79C8") {
    console.error("Owner is not set correctly");
    process.exit(1);
  }

  await deployer.setSigner();

  const newToken = await deployer.deploy(GovToken__factory, ["Token", "TKN"], { name: "Governance Token #13" });

  if ((await newToken.owner()) !== "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266") {
    console.error("Owner is not set correctly");
    process.exit(1);
  }
};

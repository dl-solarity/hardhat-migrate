import { Deployer } from "../../../../src/deployer/Deployer";

export = async (deployer: Deployer) => {
  // Moved here for testing reasons, before it was initialized globally once and failed on the second test on the .link function.
  // Because Truffle throws an error if attempting to link the same object twice to the same library.
  const GovToken = artifacts.require("GovToken");

  await deployer.setSigner("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

  await deployer.deploy(GovToken, ["Token", "TKN"], { name: "Governance Token #12" });

  const govToken5 = await deployer.deployed(GovToken, "Governance Token #12");

  if ((await govToken5.owner()) !== "0x70997970C51812dc3A010C7d01b50e0d17dc79C8") {
    console.error("Owner is not set correctly");
    process.exit(1);
  }

  await deployer.setSigner();

  const newToken = await deployer.deploy(GovToken, ["Token", "TKN"], { name: "Governance Token #13" });

  if ((await newToken.owner()) !== "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266") {
    console.error("Owner is not set correctly");
    process.exit(1);
  }
};

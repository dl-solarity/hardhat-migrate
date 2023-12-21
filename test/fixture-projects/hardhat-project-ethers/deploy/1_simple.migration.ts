import { ethers } from "hardhat";

import { Deployer } from "../../../../src/deployer/Deployer";
import { PublicReporter as Reporter } from "../../../../src/tools/reporters/PublicReporter";

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export = async (deployer: Deployer) => {
  const votingPowerLibFactory = await ethers.getContractFactory("VotingPowerLib");
  const timestampClockLibFactory = await ethers.getContractFactory("TimestampClockLib");

  const votingPowerLib = await deployer.deploy(votingPowerLibFactory);
  const timestampClockLib = await deployer.deploy(timestampClockLibFactory);

  const govTokenFactory = await ethers.getContractFactory("GovToken", {
    libraries: {
      VotingPowerLib: await votingPowerLib.getAddress(),
      TimestampClockLib: await timestampClockLib.getAddress(),
    },
  });

  const govToken = await deployer.deploy(govTokenFactory, ["Token", "TKN"], {
    name: "contracts/GovToken.sol:GovToken",
  });

  const transferOwnershipTx = (await (await govToken.transferOwnership(TOKEN_OWNER)).wait())!;

  await Reporter.reportTransactionByHash(
    transferOwnershipTx.hash,
    "Transfer Ownership of Governance Token to Token Owner",
  );

  Reporter.reportContracts([
    `Governance Token ${await govToken.name()} (${await govToken.symbol()}) Address`,
    await govToken.getAddress(),
  ]);
};

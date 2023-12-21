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

  await deployer.deploy(votingPowerLibFactory, { name: "VotingPowerLib #1" });
  await deployer.deploy(votingPowerLibFactory, { name: "VotingPowerLib #5" });
  await deployer.deploy(votingPowerLibFactory, { name: "VotingPowerLib #6" });

  await deployer.deploy(timestampClockLibFactory, { name: "TimestampClockLib #1" });
  await deployer.deploy(timestampClockLibFactory, { name: "TimestampClockLib #5" });
  await deployer.deploy(timestampClockLibFactory, { name: "TimestampClockLib #6" });

  await deployer.deploy(govTokenFactory, ["Token", "TKN"], {
    name: "contracts/GovToken.sol:GovToken",
    libraries: {
      VotingPowerLib: await (await deployer.deployed(votingPowerLibFactory, "VotingPowerLib #5")).getAddress(),
      TimestampClockLib: await (await deployer.deployed(timestampClockLibFactory, "TimestampClockLib #5")).getAddress(),
    },
  });

  const govToken5 = await deployer.deployed(govTokenFactory, "contracts/GovToken.sol:GovToken");

  await govToken5.transferOwnership(TOKEN_OWNER);

  Reporter.reportContracts([
    `Governance Token ${await govToken5.name()} (${await govToken5.symbol()}) Address`,
    await govToken5.getAddress(),
  ]);
};

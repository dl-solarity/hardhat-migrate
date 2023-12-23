import { Deployer } from "../../../../src/deployer/Deployer";
import { PublicReporter as Reporter } from "../../../../src/tools/reporters/PublicReporter";

import { GovToken__factory, TimestampClockLib__factory, VotingPowerLib__factory } from "../typechain-types";

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export = async (deployer: Deployer) => {
  await deployer.deploy(VotingPowerLib__factory, { name: "VotingPowerLib #1" });
  await deployer.deploy(VotingPowerLib__factory, { name: "VotingPowerLib #5" });
  await deployer.deploy(VotingPowerLib__factory, { name: "VotingPowerLib #6" });

  await deployer.deploy(TimestampClockLib__factory, { name: "TimestampClockLib #1" });
  await deployer.deploy(TimestampClockLib__factory, { name: "TimestampClockLib #5" });
  await deployer.deploy(TimestampClockLib__factory, { name: "TimestampClockLib #6" });

  await deployer.deploy(GovToken__factory, ["Token", "TKN"], { name: "Governance Token #1" });
  await deployer.deploy(GovToken__factory, ["Token", "TKN"], {
    name: "Governance Token #5",
    libraries: {
      VotingPowerLib: await (await deployer.deployed(VotingPowerLib__factory, "VotingPowerLib #5")).getAddress(),
      TimestampClockLib: await (
        await deployer.deployed(TimestampClockLib__factory, "TimestampClockLib #5")
      ).getAddress(),
    },
  });
  await deployer.deploy(GovToken__factory, ["Token", "TKN"], {
    name: "Governance Token #6",
    libraries: {
      VotingPowerLib: await (await deployer.deployed(VotingPowerLib__factory, "VotingPowerLib #5")).getAddress(),
    },
  });

  const govToken5 = await deployer.deployed(GovToken__factory, "Governance Token #5");

  await govToken5.transferOwnership(TOKEN_OWNER);

  Reporter.reportContracts([
    `Governance Token ${await govToken5.name()} (${await govToken5.symbol()}) Address`,
    await govToken5.getAddress(),
  ]);
};

import { Deployer } from "../../../../src/deployer/Deployer";
import { PublicReporter as Reporter } from "../../../../src/tools/reporters/PublicReporter";

const GovToken = artifacts.require("GovToken");
const VotingPowerLib = artifacts.require("VotingPowerLib");
const TimestampClockLib = artifacts.require("TimestampClockLib");

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export = async (deployer: Deployer) => {
  await deployer.deploy(VotingPowerLib, { name: "VotingPowerLib #1" });
  await deployer.deploy(VotingPowerLib, { name: "VotingPowerLib #5" });
  await deployer.deploy(VotingPowerLib, { name: "VotingPowerLib #6" });

  await deployer.deploy(TimestampClockLib, { name: "TimestampClockLib #1" });
  await deployer.deploy(TimestampClockLib, { name: "TimestampClockLib #5" });
  await deployer.deploy(TimestampClockLib, { name: "TimestampClockLib #6" });

  await deployer.deploy(GovToken, ["Token", "TKN"], { name: "Governance Token #1" });
  await deployer.deploy(GovToken, ["Token", "TKN"], {
    name: "Governance Token #5",
    libraries: {
      VotingPowerLib: (await deployer.deployed(VotingPowerLib, "VotingPowerLib #5")).address,
      TimestampClockLib: (await deployer.deployed(TimestampClockLib, "TimestampClockLib #5")).address,
    },
  });
  await deployer.deploy(GovToken, ["Token", "TKN"], {
    name: "Governance Token #6",
    libraries: {
      VotingPowerLib: (await deployer.deployed(VotingPowerLib, "VotingPowerLib #5")).address,
    },
  });

  const govToken5 = await deployer.deployed(GovToken, "Governance Token #5");

  await govToken5.transferOwnership(TOKEN_OWNER);

  Reporter.reportContracts([
    `Governance Token ${await govToken5.name()} (${await govToken5.symbol()}) Address`,
    govToken5.address,
  ]);
};

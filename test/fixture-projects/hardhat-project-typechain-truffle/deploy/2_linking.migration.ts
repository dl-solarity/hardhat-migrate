import { TransactionReceiptParams } from "ethers";

import { Deployer } from "../../../../src/deployer/Deployer";
import { PublicReporter as Reporter } from "../../../../src/tools/reporters/PublicReporter";

const GovToken = artifacts.require("GovToken");
const VotingPowerLib = artifacts.require("VotingPowerLib");
const TimestampClockLib = artifacts.require("TimestampClockLib");

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export = async (deployer: Deployer) => {
  const votingPowerLib = await deployer.deploy(VotingPowerLib);
  const timestampClockLib = await deployer.deploy(TimestampClockLib);

  const govToken = await deployer.deploy(GovToken, ["Token", "TKN"], {
    libraries: {
      VotingPowerLib: votingPowerLib.address,
      TimestampClockLib: timestampClockLib.address,
    },
  });

  await govToken.transferOwnership(TOKEN_OWNER);

  const fundingTransaction = await deployer.sendNative(TOKEN_OWNER, 100n, "Funding Governance Token Owner #1");
  await Reporter.reportTransactionByHash(
    (fundingTransaction.receipt as TransactionReceiptParams).hash,
    "Funding Governance Token Owner #1",
  );

  await deployer.sendNative(TOKEN_OWNER, 100n, "Funding Governance Token Owner #2");
  await deployer.sendNative(TOKEN_OWNER, 100n, "Funding Governance Token Owner #3");
  await deployer.sendNative(TOKEN_OWNER, 100n, "Funding Governance Token Owner #4");
  await deployer.sendNative(TOKEN_OWNER, 100n, "Funding Governance Token Owner #5");
  await deployer.sendNative(TOKEN_OWNER, 100n, "Funding Governance Token Owner #6");
  await deployer.sendNative(TOKEN_OWNER, 100n, "Funding Governance Token Owner #7");

  Reporter.reportContracts([
    `Governance Token ${await govToken.name()} (${await govToken.symbol()}) Address`,
    govToken.address,
  ]);
};

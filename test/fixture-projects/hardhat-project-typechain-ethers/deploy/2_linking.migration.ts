import { TransactionReceiptParams } from "ethers";

import { Deployer } from "../../../../src/deployer/Deployer";
import { PublicReporter as Reporter } from "../../../../src/tools/reporters/PublicReporter";

import { GovToken__factory, TimestampClockLib__factory, VotingPowerLib__factory } from "../typechain-types";

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export = async (deployer: Deployer) => {
  const votingPowerLib = await deployer.deploy(VotingPowerLib__factory);
  const timestampClockLib = await deployer.deploy(TimestampClockLib__factory);

  const govToken = await deployer.deploy(GovToken__factory, ["Token", "TKN"], {
    libraries: {
      VotingPowerLib: await votingPowerLib.getAddress(),
      TimestampClockLib: await timestampClockLib.getAddress(),
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
    await govToken.getAddress(),
  ]);
};

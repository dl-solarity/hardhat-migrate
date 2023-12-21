import { Deployer } from "../../../../src/deployer/Deployer";
import { PublicReporter as Reporter } from "../../../../src/tools/reporters/PublicReporter";

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export = async (deployer: Deployer) => {
  const GovToken = artifacts.require("GovToken");

  const govToken = await deployer.deploy(GovToken, ["Token", "TKN"]);

  const transferOwnershipTx = await govToken.transferOwnership(TOKEN_OWNER);

  await Reporter.reportTransactionByHash(
    transferOwnershipTx.receipt.transactionHash,
    "Transfer Ownership of Governance Token to Token Owner",
  );

  Reporter.reportContracts([
    `Governance Token ${await govToken.name()} (${await govToken.symbol()}) Address`,
    govToken.address,
  ]);
};

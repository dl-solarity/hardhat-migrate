import { Deployer } from "../../../../../src/deployer/Deployer";
import { PublicReporter as Reporter } from "../../../../../src/tools/reporters/PublicReporter";

import { GovToken__factory } from "../../typechain-types";

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export = async (deployer: Deployer) => {
  const govToken = await deployer.deployed(GovToken__factory);

  const transferOwnershipTx = await govToken.transferOwnership(TOKEN_OWNER);

  await Reporter.reportTransactionByHash(
    transferOwnershipTx.hash,
    "Transfer Ownership of Governance Token to Token Owner",
  );

  Reporter.reportContracts([
    `Governance Token ${await govToken.name()} (${await govToken.symbol()}) Address`,
    await govToken.getAddress(),
  ]);
};

import { Deployer } from "../../../../src/internal/deployer/Deployer.js";
import { PublicReporter as Reporter } from "../../../../src/internal/tools/reporters/PublicReporter.js";

import { GovToken__factory } from "../typechain-types/index.js";

export default async (deployer: Deployer) => {
  const govToken = await deployer.deploy(GovToken__factory, ["Token", "TKN"]);

  const signer = await deployer.getSigner();
  const transferOwnershipTx = (await (await govToken.transferOwnership(await signer.getAddress())).wait())!;

  await Reporter.reportTransactionByHash(
    transferOwnershipTx.hash,
    "Transfer Ownership of Governance Token to Token Owner",
  );

  Reporter.reportContracts([
    `Governance Token ${await govToken.name()} (${await govToken.symbol()}) Address`,
    await govToken.getAddress(),
  ]);
};

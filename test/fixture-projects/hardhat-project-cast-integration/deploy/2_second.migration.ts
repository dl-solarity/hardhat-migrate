import { Deployer } from "../../../../src/deployer/Deployer";
import { PublicReporter as Reporter } from "../../../../src/tools/reporters/PublicReporter";

import { GovToken__factory } from "../typechain-types";

export = async (deployer: Deployer) => {
  const govToken = await deployer.deploy(GovToken__factory, ["Token", "TKN"]);

  const signer = await deployer.getSigner("test-0");
  const transferOwnershipTx = (await (await govToken.transferOwnership(await signer.getAddress())).wait())!;

  await govToken.connect(signer).transferOwnership(await (await deployer.getSigner("test-7")).getAddress());

  await govToken.transferOwnership(await signer.getAddress(), { customData: { txName: "transferOwnership again" } });

  const newSigner = await deployer.getSigner("test-8");

  await govToken.connect(signer).transferOwnership(await newSigner.getAddress());
  await govToken.connect(newSigner).transferOwnership(await signer.getAddress());

  await Reporter.reportTransactionByHash(
    transferOwnershipTx.hash,
    "Transfer Ownership of Governance Token to Token Owner",
  );

  Reporter.reportContracts([
    `Governance Token ${await govToken.name()} (${await govToken.symbol()}) Address`,
    await govToken.getAddress(),
  ]);
};

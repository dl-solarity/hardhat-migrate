import { Deployer } from "../../../../src/deployer/Deployer";
import { PublicReporter as Reporter } from "../../../../src/tools/reporters/PublicReporter";

const TOKEN_OWNER = "0x1E3953B6ee74461169A3E346060AE27bD0B5bF2B";

export = async (deployer: Deployer) => {
  const votingPowerLibData = require("../artifacts/contracts/libs/VotingPowerLib.sol/VotingPowerLib.json");
  const timestampClockLibData = require("../artifacts/contracts/libs/TimestampClockLib.sol/TimestampClockLib.json");
  const govTokenData = require("../artifacts/contracts/GovToken.sol/GovToken.json");

  const votingPowerLib = await deployer.deploy({
    bytecode: votingPowerLibData.bytecode,
    abi: votingPowerLibData.abi,
    contractName: "VotingPowerLib",
  });
  const timestampClockLib = await deployer.deploy({
    bytecode: timestampClockLibData.bytecode,
    abi: timestampClockLibData.abi,
    contractName: "TimestampClockLib",
  });

  const govToken = await deployer.deploy(
    { bytecode: govTokenData.bytecode, abi: govTokenData.abi, contractName: "GovToken" },
    ["Token", "TKN"],
    {
      libraries: {
        VotingPowerLib: await votingPowerLib.getAddress(),
        TimestampClockLib: await timestampClockLib.getAddress(),
      },
    },
  );

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

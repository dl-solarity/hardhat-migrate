import { expect } from "chai";

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { TASK_MIGRATE } from "../../../src/constants.js";
import type { MigrateConfigArgs } from "../../../src/types/index.js";
import { connection } from "../../../src/internal/tools/network/EthersProvider.js";

export async function runWithoutContinue(hre: HardhatRuntimeEnvironment, config: MigrateConfigArgs) {
  await hre.tasks.getTask(TASK_MIGRATE).run(config);
}

export async function runWithContinue(hre: HardhatRuntimeEnvironment, config: MigrateConfigArgs) {
  await hre.tasks.getTask(TASK_MIGRATE).run(config);

  const deployer = await connection!.ethers.provider.getSigner();
  const deployerBalance = await connection!.ethers.provider.getBalance(deployer.address);

  await hre.tasks.getTask(TASK_MIGRATE).run({
    ...config,
    continue: true,
  });

  const deployerBalanceAfter = await connection!.ethers.provider.getBalance(deployer.address);

  expect(deployerBalanceAfter).to.be.equal(deployerBalance);
}

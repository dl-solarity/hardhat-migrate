import { expect } from "chai";

import type { HardhatRuntimeEnvironment } from "hardhat/types/hre";

// import { TASK_MIGRATE } from "../../../src/internal/constants/index.js";
import { MigrateConfig, MigrateConfigArgs } from "../../../src/types/migrations.js";

export async function runWithoutContinue(hre: HardhatRuntimeEnvironment, config: MigrateConfigArgs) {
  await hre.run(TASK_MIGRATE, config);
}

export async function runWithContinue(hre: HardhatRuntimeEnvironment, config: MigrateConfigArgs) {
  await hre.run(TASK_MIGRATE, config);

  const deployer = await hre.ethers.provider.getSigner();
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);

  await hre.run(TASK_MIGRATE, {
    ...config,
    continue: true,
  });

  const deployerBalanceAfter = await hre.ethers.provider.getBalance(deployer.address);

  expect(deployerBalanceAfter).to.be.equal(deployerBalance);
}

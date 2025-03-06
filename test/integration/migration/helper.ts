import { expect } from "chai";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { TASK_MIGRATE } from "../../../src/constants";
import { MigrateConfig } from "../../../src/types/migrations";

export async function runWithoutContinue(hre: HardhatRuntimeEnvironment, config: MigrateConfig) {
  await hre.run(TASK_MIGRATE, config);
}

export async function runWithContinue(hre: HardhatRuntimeEnvironment, config: MigrateConfig) {
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

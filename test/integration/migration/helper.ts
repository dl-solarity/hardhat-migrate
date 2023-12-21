import { expect } from "chai";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { TASK_MIGRATE } from "../../../src/constants";
import { MigrateConfig } from "../../../src/types/migrations";

export async function runWithoutContinue(hre: HardhatRuntimeEnvironment, only: number) {
  await hre.run(TASK_MIGRATE, {
    only,
  } as MigrateConfig);
}

export async function runWithContinue(hre: HardhatRuntimeEnvironment, only: number) {
  await hre.run(TASK_MIGRATE, {
    only,
  } as MigrateConfig);

  const deployer = await hre.ethers.provider.getSigner();
  const deployerBalance = await hre.ethers.provider.getBalance(deployer.address);

  await hre.run(TASK_MIGRATE, {
    only,
    continue: true,
  } as MigrateConfig);

  const deployerBalanceAfter = await hre.ethers.provider.getBalance(deployer.address);

  expect(deployerBalanceAfter).to.be.equal(deployerBalance);
}

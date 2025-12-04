import { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import type { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import { NetworkConnection } from "hardhat/types/network";
import type { MigrateConfig } from "../../../types/index.js";

export let ethersProvider: HardhatEthers | null = null;
export let connection: NetworkConnection<"generic"> | null = null;
export let migratorConfig: MigrateConfig | null = null;

export async function createEthersProvider(hre: HardhatRuntimeEnvironment): Promise<void> {
  migratorConfig = hre.config.migrate;

  if (ethersProvider) {
    return;
  }

  connection = await hre.network.connect();
  ethersProvider = connection.ethers;
}

/**
 * Used only in test environments to ensure test atomicity
 */
export function resetEthersProvider(): void {
  connection = null;
  ethersProvider = null;
}

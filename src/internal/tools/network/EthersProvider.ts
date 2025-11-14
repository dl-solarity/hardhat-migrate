import { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import type { HardhatEthers } from "@nomicfoundation/hardhat-ethers/types";
import { NetworkConnection } from "hardhat/types/network";
import { HardhatConfig } from "hardhat/types/config";

export let ethersProvider:  HardhatEthers | null = null;
export let connection:  NetworkConnection<"generic"> | null = null;

export async function createEthersProvider(hre: HardhatRuntimeEnvironment): Promise<void> {
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

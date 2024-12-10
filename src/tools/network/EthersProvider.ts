import { HardhatRuntimeEnvironment } from "hardhat/types";

import type { HardhatEthersProvider as HardhatEthersProviderT } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

export let ethersProvider: HardhatEthersProviderT | null = null;

export function createEthersProvider(hre: HardhatRuntimeEnvironment): void {
  if (ethersProvider) {
    return;
  }

  const { HardhatEthersProvider } = require("@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider") as {
    HardhatEthersProvider: typeof HardhatEthersProviderT;
  };

  ethersProvider = new HardhatEthersProvider(hre.network.provider, hre.network.name);
}

/**
 * Used only in test environments to ensure test atomicity
 */
export function resetEthersProvider(): void {
  ethersProvider = null;
}

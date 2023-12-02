import { HardhatRuntimeEnvironment } from "hardhat/types";

import type { HardhatEthersProvider as HardhatEthersProviderT } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

export let ethersProvider: HardhatEthersProviderT | null = null;

export function initEthersProvider(hre: HardhatRuntimeEnvironment): void {
  if (ethersProvider) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { HardhatEthersProvider } = require("@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider") as {
    HardhatEthersProvider: typeof HardhatEthersProviderT;
  };

  ethersProvider = new HardhatEthersProvider(hre.network.provider, hre.network.name);
}

export function resetEthersProvider(): void {
  ethersProvider = null;
}

import type { HardhatEthersProvider as HardhatEthersProviderT } from "@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider";

export class Provider {
  public static provider: HardhatEthersProviderT;

  public static async init(hre: any): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { HardhatEthersProvider } = require("@nomicfoundation/hardhat-ethers/internal/hardhat-ethers-provider") as {
      HardhatEthersProvider: typeof HardhatEthersProviderT;
    };

    this.provider = new HardhatEthersProvider(hre.network.provider, hre.network.name);
  }
}

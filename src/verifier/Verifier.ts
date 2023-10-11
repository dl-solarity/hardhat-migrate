import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Etherscan } from "@nomicfoundation/hardhat-verify/etherscan";

export class Verifier {
  private _etherscanConfig: any;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._etherscanConfig = (_hre.config as any).etherscan;
  }

  public async verify(contractAddress: string, contractName: string, constructorArguments: any[]): Promise<void> {
    const instance = await this._getEtherscanInstance(this._hre);

    if (await instance.isVerified(contractAddress)) {
      return;
    }

    await this.verificationTask(contractAddress, contractName, constructorArguments);
  }

  private async _getEtherscanInstance(hre: HardhatRuntimeEnvironment): Promise<Etherscan> {
    const chainConfig = await Etherscan.getCurrentChainConfig(
      hre.network.name,
      hre.network.provider,
      this._etherscanConfig.customChains ?? [],
    );

    return Etherscan.fromChainConfig(this._etherscanConfig.apiKey, chainConfig);
  }

  private async verificationTask(contractAddress: string, contractName: string, ...args: any) {
    await this._hre.run("verify:etherscan", {
      address: contractAddress,
      constructorArgsParams: args,
      contract: contractName,
    });
  }
}

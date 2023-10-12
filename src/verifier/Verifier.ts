import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Etherscan } from "@nomicfoundation/hardhat-verify/etherscan";
import { Reporter } from "../tools/reporter/Reporter";
import { Args } from "../types/deployer";
import { catchError } from "../utils";

export class Verifier {
  private _etherscanConfig: any;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._etherscanConfig = (_hre.config as any).etherscan;
  }

  @catchError
  public async verify(contractAddress: string, contractName: string, constructorArguments: Args): Promise<void> {
    console.log(`\nVerifying ${contractName} at ${contractAddress}...`);
    const instance = await this._getEtherscanInstance(this._hre);

    if (await instance.isVerified(contractAddress)) {
      Reporter.getInstance().reportAlreadyVerified();
      return;
    }

    try {
      await this.verificationTask(contractAddress, contractName, constructorArguments);

      const status = await instance.getVerificationStatus(contractAddress);

      if (status.isSuccess()) {
        Reporter.getInstance().reportSuccessfulVerification();
      } else {
        Reporter.getInstance().reportVerificationError(contractAddress, contractName, status.message);
      }
    } catch (e: any) {
      if (e.message.toLowerCase().includes("already verified")) {
        Reporter.getInstance().reportAlreadyVerified();
      } else {
        Reporter.getInstance().reportVerificationError(contractAddress, contractName, e.message);
      }
    }
  }

  @catchError
  private async _getEtherscanInstance(hre: HardhatRuntimeEnvironment): Promise<Etherscan> {
    const chainConfig = await Etherscan.getCurrentChainConfig(
      hre.network.name,
      hre.network.provider,
      this._etherscanConfig.customChains ?? [],
    );

    return Etherscan.fromChainConfig(this._etherscanConfig.apiKey, chainConfig);
  }

  private async verificationTask(contractAddress: string, contractName: string, args: Args) {
    await this._hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract: contractName,
    });
  }
}

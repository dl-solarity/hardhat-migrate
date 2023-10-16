import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Etherscan } from "@nomicfoundation/hardhat-verify/etherscan";

import { catchError, suppressLogs, waitForBlock } from "../utils";

import { Args } from "../types/deployer";
import { VerifierArgs, VerifierBatchArgs } from "../types/verifier";

import { Reporter } from "../tools/reporter/Reporter";
import { MigrateConfig } from "../types/migrations";

export class Verifier {
  private _etherscanConfig: any;
  private _config: MigrateConfig;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._etherscanConfig = (_hre.config as any).etherscan;
    this._config = _hre.config.migrate;
  }

  @catchError
  public async verify(verifierArgs: VerifierArgs): Promise<void> {
    const { contractAddress, contractName, constructorArguments } = verifierArgs;

    const instance = await this._getEtherscanInstance(this._hre);

    if (await instance.isVerified(contractAddress)) {
      Reporter.reportAlreadyVerified(contractAddress, contractName);
      return;
    }

    try {
      await this.verificationTask(contractAddress, contractName, constructorArguments);

      const status = await instance.getVerificationStatus(contractAddress);

      if (status.isSuccess()) {
        Reporter.reportSuccessfulVerification(contractAddress, contractName);
      } else {
        Reporter.reportVerificationError(contractAddress, contractName, status.message);
      }
    } catch (e: any) {
      if (e.message.toLowerCase().includes("already verified")) {
        Reporter.reportAlreadyVerified(contractAddress, contractName);
      } else {
        Reporter.reportVerificationError(contractAddress, contractName, e.message);
      }
    }
  }

  @catchError
  public async verifyBatch(verifierButchArgs: VerifierBatchArgs[]) {
    if (!this._config.verify) {
      return;
    }

    Reporter.reportVerificationBatchBegin();

    await Promise.all(
      verifierButchArgs.map(async (args) => {
        await waitForBlock(this._hre, args.blockNumber + this._hre.config.migrate.confirmations);
        await this.verify(args);
      }),
    );
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

  @suppressLogs
  private async verificationTask(contractAddress: string, contractName: string, args: Args) {
    await this._hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract: contractName,
    });
  }
}

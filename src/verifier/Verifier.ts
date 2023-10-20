import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Etherscan } from "@nomicfoundation/hardhat-verify/etherscan";

import { catchError, suppressLogs } from "../utils";

import { Args } from "../types/deployer";
import { VerifierArgs } from "../types/verifier";
import { MigrateConfig, VerifyStrategy } from "../types/migrations";

import { Reporter } from "../tools/reporter/Reporter";
import { VerificationProcessor } from "../tools/storage/VerificationProcessor";

export class Verifier {
  private static _etherscanConfig: any;
  private static _config: MigrateConfig;
  private static _hre: HardhatRuntimeEnvironment;

  public static init(hre: HardhatRuntimeEnvironment) {
    this._hre = hre;
    this._etherscanConfig = (hre.config as any).etherscan;
    this._config = hre.config.migrate;
  }

  public static async processVerification(verifierArgs: VerifierArgs): Promise<void> {
    if (!this._config) {
      return;
    }

    switch (this._config.verify) {
      case VerifyStrategy.AtTheEnd: {
        VerificationProcessor.saveVerificationFunction(verifierArgs);
        break;
      }
      case VerifyStrategy.Immediately: {
        await this.verify(verifierArgs);
        break;
      }
      case VerifyStrategy.None: {
        break;
      }
    }
  }

  @catchError
  public static async verify(verifierArgs: VerifierArgs): Promise<void> {
    const { contractAddress, contractName, constructorArguments } = verifierArgs;

    const instance = await this._getEtherscanInstance(this._hre);

    if (await instance.isVerified(contractAddress)) {
      Reporter.reportAlreadyVerified(contractAddress, contractName);

      return;
    }

    for (let attempts = 0; attempts < this._config.attempts; attempts++) {
      try {
        await this._tryVerify(instance, contractAddress, contractName, constructorArguments);
      } catch (e: any) {
        this._handleVerificationError(contractAddress, contractName, e);
      }
    }
  }

  @catchError
  public static async verifyBatch(verifierButchArgs: VerifierArgs[]) {
    if (!this._config.verify) {
      return;
    }

    Reporter.reportVerificationBatchBegin();

    await Promise.all(
      verifierButchArgs.map(async (args) => {
        await this.verify(args);
      }),
    );
  }

  @catchError
  private static async _tryVerify(
    instance: Etherscan,
    contractAddress: string,
    contractName: string,
    constructorArguments: Args,
  ) {
    await this._tryRunVerificationTask(contractAddress, contractName, constructorArguments);

    const status = await instance.getVerificationStatus(contractAddress);

    if (status.isSuccess()) {
      Reporter.reportSuccessfulVerification(contractAddress, contractName);
      return;
    } else {
      Reporter.reportVerificationError(contractAddress, contractName, status.message);
    }
  }

  @catchError
  private static _handleVerificationError(contractAddress: string, contractName: string, error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      Reporter.reportAlreadyVerified(contractAddress, contractName);
      return;
    } else {
      Reporter.reportVerificationError(contractAddress, contractName, error.message);
    }
  }

  @catchError
  private static async _getEtherscanInstance(hre: HardhatRuntimeEnvironment): Promise<Etherscan> {
    const chainConfig = await Etherscan.getCurrentChainConfig(
      hre.network.name,
      hre.network.provider,
      this._etherscanConfig.customChains ?? [],
    );

    return Etherscan.fromChainConfig(this._etherscanConfig.apiKey, chainConfig);
  }

  @suppressLogs
  private static async _tryRunVerificationTask(contractAddress: string, contractName: string, args: Args) {
    await this._hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract: contractName,
    });
  }
}

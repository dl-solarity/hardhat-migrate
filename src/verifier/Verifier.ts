import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Etherscan } from "@nomicfoundation/hardhat-verify/etherscan";

import { catchError, suppressLogs } from "../utils";

import { Args } from "../types/deployer";
import { VerifierArgs } from "../types/verifier";
import { MigrateConfig, VerifyStrategy } from "../types/migrations";

import { Reporter } from "../tools/reporter/Reporter";
import { VerificationProcessor } from "../tools/storage/VerificationProcessor";

export class Verifier {
  private _etherscanConfig: any;
  private _config: MigrateConfig;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._etherscanConfig = (_hre.config as any).etherscan;
    this._config = _hre.config.migrate;
  }

  public async processVerification(verifierArgs: VerifierArgs): Promise<void> {
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
  public async verify(verifierArgs: VerifierArgs): Promise<void> {
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
  public async verifyBatch(verifierButchArgs: VerifierArgs[]) {
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
  private async _tryVerify(
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
  private _handleVerificationError(contractAddress: string, contractName: string, error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      Reporter.reportAlreadyVerified(contractAddress, contractName);
      return;
    } else {
      Reporter.reportVerificationError(contractAddress, contractName, error.message);
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

  @suppressLogs
  private async _tryRunVerificationTask(contractAddress: string, contractName: string, args: Args) {
    await this._hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract: contractName,
    });
  }
}

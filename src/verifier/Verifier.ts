import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Etherscan } from "@nomicfoundation/hardhat-verify/etherscan";
import { EtherscanConfig } from "@nomicfoundation/hardhat-verify/types";

import { catchError, getChainId, suppressLogs } from "../utils";

import { Args } from "../types/deployer";
import { VerifyConfig } from "../types/migrations";
import { VerifierArgs } from "../types/verifier";

import { initReporter, reporter } from "../tools/reporters/Reporter";
import { initNetworkManager } from "../tools/network/NetworkManager";

export class Verifier {
  private readonly _etherscanConfig: EtherscanConfig;

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _config: VerifyConfig,
  ) {
    this._etherscanConfig = (_hre.config as any).etherscan;
  }

  @catchError
  public async verifyBatch(verifierBatchArgs: VerifierArgs[]) {
    const currentChainId = Number(await getChainId());

    const toVerify = verifierBatchArgs.filter((args) => args.chainId && currentChainId == args.chainId);

    if (!toVerify || toVerify.length === 0) {
      reporter!.reportNothingToVerify();
      return;
    }

    reporter!.reportVerificationBatchBegin();

    const parallel = this._config.parallel;

    for (let i = 0; i < toVerify.length; i += parallel) {
      const batch = toVerify.slice(i, i + parallel);

      await Promise.all(batch.map((args) => this._verify(args)));
    }
  }

  @catchError
  private async _verify(verifierArgs: VerifierArgs): Promise<void> {
    const { contractAddress, contractName, constructorArguments } = verifierArgs;

    const instance = await this._getEtherscanInstance(this._hre);

    for (let attempts = 0; attempts < this._config.attempts; attempts++) {
      if (await instance.isVerified(contractAddress)) {
        reporter!.reportAlreadyVerified(contractAddress, contractName);

        break;
      }

      try {
        await this._tryVerify(instance, contractAddress, contractName, constructorArguments);
        break;
      } catch (e: any) {
        this._handleVerificationError(contractAddress, contractName, e);
      }

      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
  }

  @catchError
  private async _tryVerify(
    instance: Etherscan,
    contractAddress: string,
    contractName: string,
    constructorArguments: Args,
  ) {
    await this._tryRunVerificationTask(contractAddress, contractName, constructorArguments);

    const isVerified = await instance.isVerified(contractAddress);

    if (isVerified) {
      reporter!.reportSuccessfulVerification(contractAddress, contractName);
      return;
    } else {
      reporter!.reportVerificationError(contractAddress, contractName, "Verification failed");
    }
  }

  @catchError
  private _handleVerificationError(contractAddress: string, contractName: string, error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      reporter!.reportAlreadyVerified(contractAddress, contractName);
      return;
    } else {
      reporter!.reportVerificationError(contractAddress, contractName, error.message);
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

  public static async initialize(hre: HardhatRuntimeEnvironment): Promise<void> {
    initNetworkManager(hre);
    await initReporter(hre.config.migrate);
  }
}

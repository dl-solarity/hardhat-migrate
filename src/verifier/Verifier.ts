import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Etherscan } from "@nomicfoundation/hardhat-verify/etherscan";
import { EtherscanConfig } from "@nomicfoundation/hardhat-verify/types";

import { catchError, getChainId, suppressLogs } from "../utils";

import { Args } from "../types/deployer";
import { MigrateConfig } from "../types/migrations";
import { VerifierArgs } from "../types/verifier";

import { Reporter } from "../tools/reporters/Reporter";

export class Verifier {
  private readonly _config: MigrateConfig;
  private readonly _etherscanConfig: EtherscanConfig;

  constructor(private _hre: HardhatRuntimeEnvironment) {
    this._config = _hre.config.migrate;
    this._etherscanConfig = (_hre.config as any).etherscan;
  }

  @catchError
  public async verify(verifierArgs: VerifierArgs): Promise<void> {
    const { contractAddress, contractName, constructorArguments, chainId } = verifierArgs;

    if ((await getChainId(this._hre)) !== chainId) {
      // TODO: Add actions for this case.
      return;
    }

    const instance = await this._getEtherscanInstance(this._hre);

    if (await instance.isVerified(contractAddress)) {
      Reporter.reportAlreadyVerified(contractAddress, contractName);

      return;
    }

    for (let attempts = 0; attempts < this._config.verifyConfig.attempts; attempts++) {
      try {
        await this._tryVerify(instance, contractAddress, contractName, constructorArguments);
        break;
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

    const parallel = this._config.migrateVerify;

    for (let i = 0; i < verifierButchArgs.length; i += parallel) {
      const batch = verifierButchArgs.slice(i, i + parallel);
      await Promise.all(
        batch.map((args) => {
          this.verify(args);
        }),
      );
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

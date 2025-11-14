import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types/hre";

import { verifyContract } from "@nomicfoundation/hardhat-verify/verify";

import { CatchMethodError, getChainId, getPossibleImplementationAddress, sleep, SuppressLogs } from "../utils/index.js";

import { Args } from "../../types/deployer.js";
import { VerifierArgs, VerifyConfig } from "../../types/index.js";

import { buildNetworkDeps } from "../tools/network/NetworkManager.js";
import { createAndInitReporter, Reporter } from "../tools/reporters/Reporter.js";
import { callEtherscanApi, RESPONSE_OK } from "../tools/network/etherscan-api.js";

export class Verifier {
  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _config: VerifyConfig,
    private _standalone = false,
  ) {
  }

  @CatchMethodError
  public async verifyBatch(verifierBatchArgs: VerifierArgs[]) {
    const currentChainId = Number(await getChainId());

    const toVerify = verifierBatchArgs.filter((args) => args.chainId && currentChainId == args.chainId);

    if (!toVerify || toVerify.length === 0) {
      Reporter!.reportNothingToVerify();
      return;
    }

    const verificationDelay = this._hre.config.migrate.verification.verificationDelay;
    if (verificationDelay > 0 && !this._standalone) {
      await Reporter!.startSpinner("verification-delay", () => "Waiting for the explorer to sync up");

      await sleep(verificationDelay);

      Reporter!.stopSpinner();
    }

    Reporter!.reportVerificationBatchBegin();

    const parallel = this._config.parallel;

    for (let i = 0; i < toVerify.length; i += parallel) {
      const batch = toVerify.slice(i, i + parallel);

      await Promise.all(batch.map((args) => this._verify(args)));
    }
  }

  @CatchMethodError
  private async _verify(verifierArgs: VerifierArgs): Promise<void> {
    const { contractAddress, contractName, constructorArguments } = verifierArgs;

    for (let attempts = 0; attempts < this._config.attempts; attempts++) {
      try {
        await this._tryVerify(contractAddress, contractName, constructorArguments);
        break;
      } catch (e: any) {
        this._handleVerificationError(contractAddress, contractName, e);

        if (
          e.message !== undefined &&
          typeof e.message === "string" &&
          (e.message.includes("HH303: Unrecognized task 'verify:verify'") || e.message.includes("already verified"))
        ) {
          break;
        }
      }

      await sleep(2500);
    }
  }

  @CatchMethodError
  private async _tryVerify(
    contractAddress: string,
    contractName: string,
    constructorArguments: Args,
  ) {
    const verified =
      (await this._tryVerifyWithProvider("etherscan", contractAddress, contractName, constructorArguments)) ||
      (await this._tryVerifyWithProvider("blockscout", contractAddress, contractName, constructorArguments));

    if (verified) Reporter!.reportSuccessfulVerification(contractAddress, contractName);
    else Reporter!.reportVerificationError(contractAddress, contractName, "Verification failed");
  }

  @SuppressLogs
  private async _tryVerifyWithProvider(
    provider: "etherscan" | "blockscout",
    contractAddress: string,
    contractName: string,
    constructorArguments: Args,
  ): Promise<boolean> {
    try {
      const ok = await verifyContract(
        {
          address: contractAddress,
          constructorArgs: constructorArguments as unknown[],
          contract: contractName,
          force: true,
          provider,
        },
        this._hre,
      );

      // In previous versions we linked proxy ABI on Etherscan. Skip for Blockscout.
      if (ok && provider === "etherscan") {
        // Best-effort proxy linking; ignore failures.
        await this._verifyProxy(contractAddress).catch(() => {});
      }

      return ok;
    } catch (e: any) {
      // Fallback when provider isn't configured or unsupported; let caller try the next provider.
      const msg = (e?.message ?? "").toString().toLowerCase();
      const isProviderConfigError =
        msg.includes("block explorer not configured") ||
        msg.includes("explorer_request") ||
        msg.includes("invalid verification provider");

      if (isProviderConfigError) return false;
      throw e;
    }
  }

  @CatchMethodError
  private _handleVerificationError(contractAddress: string, contractName: string, error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      Reporter!.reportAlreadyVerified(contractAddress, contractName);
      return;
    } else {
      Reporter!.reportVerificationError(contractAddress, contractName, error.message);
    }
  }

  private async _verifyProxy(proxyAddress: string) {
    try {
      const implementationAddress = await getPossibleImplementationAddress(proxyAddress);
      if (implementationAddress === ethers.ZeroAddress) {
        return;
      }

      await this._linkProxyWithImplementationAbi(proxyAddress, implementationAddress);
    } catch (e) {
      /* empty */
    }
  }

  /**
   * Calls the Etherscan API to link a proxy with its implementation ABI.
   *
   * Source: https://github.com/OpenZeppelin/openzeppelin-upgrades
   */
  private async _linkProxyWithImplementationAbi(proxyAddress: string, implAddress: string) {
    const etherscanApiKey =
      // New config location (hardhat-verify v3)
      (await (this._hre.config as any)?.verify?.etherscan?.apiKey?.get?.()) ??
      // Legacy config location (fallback)
      (this._hre.config as any)?.etherscan?.apiKey ??
      "";
    const etherscanApiUrl =
      (this._hre.config as any)?.verify?.etherscan?.apiUrl ??
      // Default public API endpoint
      "https://api.etherscan.io/v2/api";

    const params = {
      module: "contract",
      action: "verifyproxycontract",
      address: proxyAddress,
      expectedimplementation: implAddress,
    };
    let verifyProxyResponse = await callEtherscanApi({ apiUrl: etherscanApiUrl, apiKey: etherscanApiKey }, params);

    if (verifyProxyResponse.status === RESPONSE_OK) {
      // initial call was OK, but need to send a status request using the
      // returned guid to get the actual verification status
      let responseBody = await this._checkProxyVerificationStatus(
        { apiUrl: etherscanApiUrl, apiKey: etherscanApiKey },
        verifyProxyResponse.result,
      );

      while (responseBody.result === "Pending in queue") {
        await sleep(5000);
        responseBody = await this._checkProxyVerificationStatus(
          { apiUrl: etherscanApiUrl, apiKey: etherscanApiKey },
          verifyProxyResponse.result,
        );
      }
    }

    if (verifyProxyResponse.status === RESPONSE_OK) {
      Reporter!.reportSuccessfulProxyLinking(proxyAddress, implAddress);
    } else {
      Reporter!.reportFailedProxyLinking(proxyAddress, implAddress, verifyProxyResponse.result);
    }
  }

  private async _checkProxyVerificationStatus(instance: { apiUrl: string; apiKey: string }, guid: string) {
    const checkProxyVerificationParams = {
      module: "contract",
      action: "checkproxyverification",
      apikey: instance.apiKey,
      guid: guid,
    };

    return callEtherscanApi(instance, checkProxyVerificationParams);
  }

  public static async buildVerifierTaskDeps(hre: HardhatRuntimeEnvironment): Promise<void> {
    await buildNetworkDeps(hre);
    await createAndInitReporter(hre);
  }
}

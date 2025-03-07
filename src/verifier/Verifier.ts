import { ethers } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Etherscan } from "@nomicfoundation/hardhat-verify/etherscan";

import { MigrateError } from "../errors";

import { catchError, getChainId, getPossibleImplementationAddress, sleep, suppressLogs } from "../utils";

import { Args } from "../types/deployer";
import { VerifyConfig } from "../types/migrations";
import { VerifierArgs } from "../types/verifier";
import { EtherscanConfig } from "../types/etherscan";

import { sendGetRequest } from "../tools/network/requests";
import { buildNetworkDeps } from "../tools/network/NetworkManager";
import { createAndInitReporter, Reporter } from "../tools/reporters/Reporter";
import { callEtherscanApi, RESPONSE_OK } from "../tools/network/etherscan-api";

export class Verifier {
  private readonly _etherscanConfig: EtherscanConfig;

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _config: VerifyConfig,
    private _standalone = false,
  ) {
    this._etherscanConfig = (_hre.config as any).etherscan;
  }

  @catchError
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

  @catchError
  private async _verify(verifierArgs: VerifierArgs): Promise<void> {
    const { contractAddress, contractName, constructorArguments } = verifierArgs;

    const instance = await this._getEtherscanInstance(this._hre);

    await this._validateExplorerConfiguration(instance, contractAddress);

    for (let attempts = 0; attempts < this._config.attempts; attempts++) {
      if (await instance.isVerified(contractAddress)) {
        Reporter!.reportAlreadyVerified(contractAddress, contractName);

        await this._verifyProxy(instance, contractAddress);

        break;
      }

      try {
        await this._tryVerify(instance, contractAddress, contractName, constructorArguments);
        break;
      } catch (e: any) {
        this._handleVerificationError(contractAddress, contractName, e);

        if (
          e.message !== undefined &&
          typeof e.message === "string" &&
          e.message.includes("HH303: Unrecognized task 'verify:verify'")
        ) {
          break;
        }
      }

      await sleep(2500);
    }
  }

  @catchError
  private async _tryVerify(
    instance: Etherscan,
    contractAddress: string,
    contractName: string,
    constructorArguments: Args,
  ) {
    await this._tryRunVerificationTask(instance, contractAddress, contractName, constructorArguments);

    const isVerified = await instance.isVerified(contractAddress);

    if (isVerified) {
      Reporter!.reportSuccessfulVerification(contractAddress, contractName);
      return;
    } else {
      Reporter!.reportVerificationError(contractAddress, contractName, "Verification failed");
    }
  }

  @catchError
  private _handleVerificationError(contractAddress: string, contractName: string, error: any) {
    if (error.message.toLowerCase().includes("already verified")) {
      Reporter!.reportAlreadyVerified(contractAddress, contractName);
      return;
    } else {
      Reporter!.reportVerificationError(contractAddress, contractName, error.message);
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
  private async _tryRunVerificationTask(
    instance: Etherscan,
    contractAddress: string,
    contractName: string,
    args: Args,
  ) {
    await this._hre.run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
      contract: contractName,
    });

    await this._verifyProxy(instance, contractAddress);
  }

  private async _validateExplorerConfiguration(instance: Etherscan, contractAddress: string) {
    const parameters = new URLSearchParams({
      apikey: instance.apiKey,
      module: "contract",
      action: "getsourcecode",
      address: contractAddress,
    });

    const url = new URL(instance.apiUrl);
    url.search = parameters.toString();

    const response = await sendGetRequest(url.toString());

    if (response.status !== 200) {
      throw new MigrateError(
        `The explorer responded with a status code of ${response.status} for the URL "${url.toString().split("?")[0]}".`,
      );
    }
  }

  private async _verifyProxy(instance: Etherscan, proxyAddress: string) {
    try {
      const implementationAddress = await getPossibleImplementationAddress(proxyAddress);
      if (implementationAddress === ethers.ZeroAddress) {
        return;
      }

      await this._linkProxyWithImplementationAbi(instance, proxyAddress, implementationAddress);
    } catch (e) {
      /* empty */
    }
  }

  /**
   * Calls the Etherscan API to link a proxy with its implementation ABI.
   *
   * Source: https://github.com/OpenZeppelin/openzeppelin-upgrades
   */
  private async _linkProxyWithImplementationAbi(instance: Etherscan, proxyAddress: string, implAddress: string) {
    const params = {
      module: "contract",
      action: "verifyproxycontract",
      address: proxyAddress,
      expectedimplementation: implAddress,
    };
    let verifyProxyResponse = await callEtherscanApi(instance, params);

    if (verifyProxyResponse.status === RESPONSE_OK) {
      // initial call was OK, but need to send a status request using the
      // returned guid to get the actual verification status
      let responseBody = await this._checkProxyVerificationStatus(instance, verifyProxyResponse.result);

      while (responseBody.result === "Pending in queue") {
        await sleep(5000);
        responseBody = await this._checkProxyVerificationStatus(instance, verifyProxyResponse.result);
      }
    }

    if (verifyProxyResponse.status === RESPONSE_OK) {
      Reporter!.reportSuccessfulProxyLinking(proxyAddress, implAddress);
    } else {
      Reporter!.reportFailedProxyLinking(proxyAddress, implAddress, verifyProxyResponse.result);
    }
  }

  private async _checkProxyVerificationStatus(instance: Etherscan, guid: string) {
    const checkProxyVerificationParams = {
      module: "contract",
      action: "checkproxyverification",
      apikey: instance.apiKey,
      guid: guid,
    };

    return callEtherscanApi(instance, checkProxyVerificationParams);
  }

  public static async buildVerifierTaskDeps(hre: HardhatRuntimeEnvironment): Promise<void> {
    buildNetworkDeps(hre);
    await createAndInitReporter(hre);
  }
}

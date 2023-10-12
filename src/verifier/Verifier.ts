import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { callEtherscanApi, RESPONSE_OK } from "./etherscan-api";

import { pluginName } from "../constants";
import { MigrateError } from "../errors";
import { EtherscanAPIConfig } from "../types/verifier";

export class Verifier {
  constructor(private _hre: HardhatRuntimeEnvironment) {}

  public async verify(address: string, args: any[], contractName: string) {
    try {
      await this._hre.run("verify:verify", {
        address: address,
        constructorArguments: args,
        contract: contractName,
        noCompile: true,
        // TOOD: If your contract has libraries with undetectable addresses, you may pass the libraries parameter
        // with a dictionary specifying them:
        // libraries: {
        //   SomeLibrary: "0x...",
        // },
      });
    } catch (e: unknown) {
      throw new MigrateError(`Error verifying contract: ${e}`);
    }
  }

  /**
   * Calls the Etherscan API to link a proxy with its implementation ABI.
   *
   * Source: https://github.com/OpenZeppelin/openzeppelin-upgrades
   *
   * @param etherscanApi The Etherscan API config
   * @param proxyAddress The proxy address
   * @param implAddress The implementation address
   */
  private async linkProxyWithImplementationAbi(
    etherscanApi: EtherscanAPIConfig,
    proxyAddress: string,
    implAddress: string,
  ) {
    console.info(`Linking proxy ${proxyAddress} with implementation`);
    const params = {
      module: "contract",
      action: "verifyproxycontract",
      address: proxyAddress,
      expectedimplementation: implAddress,
    };
    let responseBody = await callEtherscanApi(etherscanApi, params);

    if (responseBody.status === RESPONSE_OK) {
      // the initial call was OK, but need to send a status request using the returned guid
      // to get the actual verification status
      const guid = responseBody.result;
      responseBody = await this.checkProxyVerificationStatus(etherscanApi, guid);

      while (responseBody.result === "Pending in queue") {
        await delay(3000);
        responseBody = await this.checkProxyVerificationStatus(etherscanApi, guid);
      }
    }

    if (responseBody.status === RESPONSE_OK) {
      console.info("Successfully linked proxy to implementation.");
    } else {
      throw new NomicLabsHardhatPluginError(
        pluginName,
        `Failed to link proxy ${proxyAddress} with its implementation. Reason: ${responseBody.result}`,
      );
    }

    async function delay(ms: number): Promise<void> {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  private async checkProxyVerificationStatus(etherscanApi: EtherscanAPIConfig, guid: string) {
    const checkProxyVerificationParams = {
      module: "contract",
      action: "checkproxyverification",
      apikey: etherscanApi.key,
      guid: guid,
    };
    return callEtherscanApi(etherscanApi, checkProxyVerificationParams);
  }
}

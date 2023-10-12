/**
 * Source: https://github.com/OpenZeppelin/openzeppelin-upgrades
 */

import { resolveEtherscanApiKey } from "@nomiclabs/hardhat-etherscan/dist/src/resolveEtherscanApiKey";

import { EtherscanConfig } from "@nomiclabs/hardhat-etherscan/dist/src/types";
import { NomicLabsHardhatPluginError } from "hardhat/plugins";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { request } from "undici";

import { pluginName } from "../constants";
import { EtherscanAPIConfig, EtherscanResponseBody } from "../types/verifier";

/**
 * Call the configured Etherscan API with the given parameters.
 *
 * @param etherscanApi The Etherscan API config
 * @param params The API parameters to call with
 * @returns The Etherscan API response
 */
export async function callEtherscanApi(etherscanApi: EtherscanAPIConfig, params: any): Promise<EtherscanResponseBody> {
  const parameters = new URLSearchParams({ ...params, apikey: etherscanApi.key });

  const response = await request(etherscanApi.endpoints.urls.apiURL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: parameters.toString(),
  });

  if (!(response.statusCode >= 200 && response.statusCode <= 299)) {
    const responseBodyText = await response.body.text();
    throw new NomicLabsHardhatPluginError(
      pluginName,
      `Etherscan API call failed with status ${response.statusCode}, response: ${responseBodyText}`,
    );
  }

  return <Promise<EtherscanResponseBody>>response.body.json();
}

/**
 * Gets the Etherscan API parameters from Hardhat config.
 * Makes use of Hardhat Etherscan for handling cases when Etherscan API parameters are not present in config.
 */
export async function getEtherscanAPIConfig(hre: HardhatRuntimeEnvironment): Promise<EtherscanAPIConfig> {
  const endpoints = await hre.run("verify:get-etherscan-endpoint");
  const etherscanConfig: EtherscanConfig = (hre.config as any).etherscan;
  const key = resolveEtherscanApiKey(etherscanConfig.apiKey, endpoints.network);
  return { key, endpoints };
}

export const RESPONSE_OK = "1";

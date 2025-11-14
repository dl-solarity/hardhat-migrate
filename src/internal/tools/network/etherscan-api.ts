/**
 * Source: https://github.com/OpenZeppelin/openzeppelin-upgrades
 */

import { networkManager } from "./NetworkManager.js";

import { MigrateError } from "../../utils/index.js";

/**
 * The response body from an Etherscan API call.
 */
interface EtherscanResponseBody {
  status: string;
  message: string;
  result: any;
}

export const RESPONSE_OK = "1";

/**
 * Call the configured Etherscan API with the given parameters.
 */
export async function callEtherscanApi(
  instance: { apiUrl: string; apiKey: string },
  params: any,
): Promise<EtherscanResponseBody> {
  const parameters = new URLSearchParams({ ...params, apikey: instance.apiKey });

  const response = await networkManager!.axios.post(instance.apiUrl, parameters.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!(response.status >= 200 && response.status < 300)) {
    throw new MigrateError(
      `Etherscan API call failed with status ${response.status}, response: ${JSON.stringify(response.data)}`,
    );
  }

  return response.data;
}

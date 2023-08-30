import { EtherscanNetworkEntry } from "@nomiclabs/hardhat-etherscan/dist/src/types";

/**
 * The Etherscan API parameters from the Hardhat config.
 */
export interface EtherscanAPIConfig {
  key: string;
  endpoints: EtherscanNetworkEntry;
}

/**
 * The response body from an Etherscan API call.
 */
export interface EtherscanResponseBody {
  status: string;
  message: string;
  result: any;
}

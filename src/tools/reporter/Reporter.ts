/* eslint-disable no-console */
import axios from "axios";

import { TransactionResponse } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ChainRecord, defaultCurrencySymbol, predefinedChains } from "../../types/verifier";

export class Reporter {
  public nativeSymbol = defaultCurrencySymbol;

  private totalCost: bigint = BigInt(0);
  private totalTransactions: number = 0;

  constructor(
    private _hre: HardhatRuntimeEnvironment,
    private _verbose = false,
  ) {}

  public async init() {
    this.nativeSymbol = await this._getNativeSymbol();
  }

  public static async reportDeploy(tx: TransactionResponse) {
    console.log("\nDeploying contract...");

    console.log(`transactionHash: ${tx.hash}`);

    console.log(`blockNumber: ${tx.blockNumber}`);

    console.log(`gasLimit: ${tx.gasLimit.toString()}`);

    console.log(`gasPrice: ${tx.gasPrice.toString()}`);

    console.log(`value: ${tx.value.toString()}`);
  }

  public summary() {
    const output =
      `> ${"Total transactions:".padEnd(20)} ${this.totalTransactions}\n` +
      `> ${"Final cost:".padEnd(20)} ${this.totalCost.toString()} ${this.nativeSymbol}\n`;

    console.log(output);
  }

  private async _getNativeSymbol(): Promise<string> {
    const chainId = Number((await this._hre.ethers.provider.getNetwork()).chainId);

    if (predefinedChains[chainId]) {
      return predefinedChains[chainId].nativeCurrency.symbol;
    }

    try {
      const chain = await this._getChainById(chainId);

      if (chain) {
        return chain.nativeCurrency.symbol;
      }
    } catch (e) {
      console.warn(`Unable to get native symbol for chainId ${chainId}.`, e);
    }

    return defaultCurrencySymbol;
  }

  private async _getChainById(chainId: number): Promise<ChainRecord | undefined> {
    const chains = await this._getAllRecords();

    return chains.find((chain) => chain.chainId === chainId);
  }

  private async _getAllRecords(): Promise<ChainRecord[]> {
    const url = "https://chainid.network/chains.json";
    const response = await axios.get(url);

    // Assuming the JSON response is an array of record objects
    return response.data as ChainRecord[];
  }
}

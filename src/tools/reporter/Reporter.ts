import axios from "axios";
import { TransactionResponse } from "ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { ChainRecord, defaultCurrencySymbol, predefinedChains } from "../../types/chain-id-api";
import { ReportMessage } from "../../types/reporter";

export class Reporter {
  public nativeSymbol = defaultCurrencySymbol;
  // TODO: or make class static?
  constructor(private _hre: HardhatRuntimeEnvironment, private _verbose = false) {}

  public async init() {
    this.nativeSymbol = await this._getNativeSymbol();
  }

  public report(message: ReportMessage): void {
    if (this._verbose) {
      console.log(message);
    }
  }

  public static reportDeploy(tx: TransactionResponse) {
    console.log(`Deploying contract...`);

    console.log(`transactionHash: ${tx.hash}`);

    console.log(`blockNumber: ${tx.blockNumber}`);

    console.log(tx);
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

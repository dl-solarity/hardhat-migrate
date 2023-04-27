const Web3 = require("web3");

import axios from "axios";

import { BigNumber } from "bignumber.js";
import { HardhatRuntimeEnvironment } from "hardhat/types";

import { ChainRecord } from "../types";

export class Logger {
  public nativeSymbol: string = "";

  private totalCost: BigNumber = BigNumber(0);
  private totalTransactions: number = 0;

  constructor(private hre: HardhatRuntimeEnvironment) {}

  async init() {
    this.nativeSymbol = await this.getNativeSymbol();
  }

  logTransaction(tx: any, name: any, printLogs: boolean = false) {
    const excludedKeys = [
      "contractAddress",
      "cumulativeGasUsed",
      "status",
      "transactionIndex",
      "type",
      "logsBloom",
      "blockHash",
      "transactionHash",
    ];
    let output = this.underline(`Transaction '${name}'`);
    let logs = "";

    output += `   + ${"transactionHash:".padEnd(20)} ${tx.receipt.transactionHash}\n`;

    for (const [key, value] of Object.entries(tx.receipt)) {
      if (excludedKeys.includes(key)) {
        continue;
      }

      if (key.toLowerCase().includes("logs")) {
        logs += `   + ${(key + ":").padEnd(20)} \n${JSON.stringify(value, null, 2)}\n`;
        continue;
      }

      switch (key) {
        case "effectiveGasPrice":
          output += `   + ${"gasPrice:".padEnd(20)} ${BigNumber(<string>value).div(10 ** 9)} gwei\n`;
          break;
        case "from":
          output += `   + ${"account:".padEnd(20)} ${value}\n`;
          break;
        case "to":
          output += `   + ${"recipient:".padEnd(20)} ${value}\n`;
          break;
        default:
          output += `   + ${(key + ":").padEnd(20)} ${value}\n`;
      }
    }

    if (tx.receipt.effectiveGasPrice != undefined) {
      const totalCost = BigNumber(tx.receipt.effectiveGasPrice)
        .times(tx.receipt.gasUsed)
        .div(10 ** 18);

      output += `   + ${"totalCost:".padEnd(20)} ${totalCost} ${this.nativeSymbol}\n`;

      this.totalTransactions += 1;
      this.totalCost = this.totalCost.plus(totalCost);
    }

    console.log(output);

    if (printLogs) {
      console.log(logs);
    }
  }

  summary() {
    const output =
      `> ${"Total transactions:".padEnd(20)} ${this.totalTransactions}\n` +
      `> ${"Final cost:".padEnd(20)} ${this.totalCost.toString()} ${this.nativeSymbol}\n`;

    console.log(output);
  }

  logContracts(...contracts: any) {
    const table = [];

    for (const element of contracts) {
      table.push({ Contract: element[0], Address: element[1] });
    }

    console.table(table);

    console.log();
  }

  log(...args: any[]) {
    if (this.nativeSymbol === "ETH") {
      console.log(...args);
      return;
    }

    const pattern = /\b\w+\b:\s*\d+(?:\.\d+)?\s*ETH\b/g;

    const replacedArgs = args.map((arg) => {
      if (typeof arg === "string") {
        return arg.replace(pattern, (match) => {
          return match.replace("ETH", `${this.nativeSymbol}`);
        });
      }

      return arg;
    });

    console.log(...replacedArgs);
  }

  private async getNativeSymbol(): Promise<string> {
    const web3 = new Web3(this.hre.network.provider);
    const chainId = await web3.eth.getChainId();

    const chain = await this.filterChainsByChainId(chainId);

    if (chain && chainId !== 31337 && chainId !== 1337) {
      return chain.nativeCurrency.symbol;
    }

    return "ETH";
  }

  private async filterChainsByChainId(chainId: number): Promise<ChainRecord | undefined> {
    const chains = await this.getRecords();

    return chains.find((chain) => chain.chainId === chainId);
  }

  private async getRecords(): Promise<ChainRecord[]> {
    const url = "https://chainid.network/chains.json";
    const response = await axios.get(url);

    // Assuming the JSON response is an array of record objects
    return response.data as ChainRecord[];
  }

  private underline(msg: string): string {
    return `\n   ${msg}\n   ${"-".repeat(msg.length)}\n`;
  }
}

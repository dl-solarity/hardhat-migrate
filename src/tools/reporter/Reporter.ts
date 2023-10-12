/* eslint-disable no-console */
import axios from "axios";

import { Network, TransactionReceipt, TransactionResponse } from "ethers";

import ora from "ora";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MigrateError } from "../../errors";
import { ChainRecord, defaultCurrencySymbol, predefinedChains } from "../../types/verifier";
import { catchError, underline } from "../../utils";

@catchError
export class Reporter {
  public static _instance: Reporter;

  private _hre: HardhatRuntimeEnvironment = {} as HardhatRuntimeEnvironment;

  private totalCost: bigint = BigInt(0);
  private totalTransactions: number = 0;

  private constructor() {}

  public static getInstance(): Reporter {
    if (!Reporter._instance) {
      Reporter._instance = new Reporter();
    }

    return Reporter._instance;
  }

  public init(hre: HardhatRuntimeEnvironment) {
    this._hre = hre;
  }

  public async reportMigrationBegin(files: string[]) {
    this._reportMigrationFiles(files);

    await this._reportChainInfo();

    console.log("\nStarting migration...\n");
  }

  public async reportMigrationFileBegin(file: string) {
    console.log(`\n${underline(`Running ${file}...`)}`);
  }

  public async summary() {
    const output =
      `> ${"Total transactions:".padEnd(20)} ${this.totalTransactions}\n` +
      `> ${"Final cost:".padEnd(20)} ${this.totalCost.toString()} ${await this._getNativeSymbol()}\n`;

    console.log(output);
  }

  public async reportTransaction(tx: TransactionResponse | string, misc: string) {
    if (typeof tx === "string") {
      tx = (await this._hre.ethers.provider.getTransaction(tx))!;
    }

    const timeStart = Date.now();

    console.log("\n" + underline(await this._parseTransactionTitle(tx, misc)));

    console.log(`> explorer: ${await this._getExplorerLink(tx.hash)}`);

    const spinner = ora(await this._formatPendingTime(tx, timeStart)).start();

    const spinnerInterval = setInterval(
      async () => (spinner.text = await this._formatPendingTime(tx as TransactionResponse, timeStart)),
      1000,
    );

    const wait = tx.wait(1);

    wait.finally(() => {
      clearInterval(spinnerInterval);

      spinner.stop();
    });

    let receipt;
    try {
      receipt = (await wait)!;
    } catch (e: any) {
      throw new MigrateError(`Transaction failed: ${e.message}`);
    }

    await this._printTransaction(receipt);

    this.totalCost += receipt.fee;
    this.totalTransactions++;
  }

  public async notifyDeploymentInsteadOfRecovery(contractName: string) {
    const output = `\nUnfortunately, we can't recover contract address for ${contractName}. Deploying instead...`;

    console.log(output);
  }

  public async notifyTransactionSendingInsteadOfRecovery(contractMethod: string) {
    const output = `\nUnfortunately, we can't recover transaction for ${contractMethod}. Sending instead...`;

    console.log(output);
  }

  public async notifyContractRecovery(contractName: string, contractAddress: string) {
    const output = `\nContract address for ${contractName} has been recovered: ${contractAddress}\n`;

    console.log(output);
  }

  public async notifyTransactionRecovery(methodString: string) {
    const output = `\nTransaction ${methodString} has been recovered.\n`;

    console.log(output);
  }

  public async reportSuccessfulVerification() {
    const output = `\nContract has been successfully verified.\n`;

    console.log(output);
  }

  public async reportAlreadyVerified() {
    const output = `\nContract has been already verified.\n`;

    console.log(output);
  }

  public async reportVerificationError(contractAddress: string, contractName: string, message: string) {
    const output = `\nContract ${contractName} (${contractAddress}) verification failed: ${message}\n`;

    console.log(output);
  }

  private async _parseTransactionTitle(tx: TransactionResponse, misc: string): Promise<string> {
    if (tx.to === null) {
      return `Deploying${misc ? " " + misc.split(":")[1] : ""}`;
    }

    return `Transaction: ${misc}`;
  }

  private async _formatPendingTime(tx: TransactionResponse, startTime: number): Promise<string> {
    return `Blocks: ${await tx.confirmations()} Seconds: ${((Date.now() - startTime) / 1000).toFixed(0)}`;
  }

  private async _getExplorerLink(txHash: string): Promise<string> {
    return (await this._getExplorerUrl()) + "/tx/" + txHash;
  }

  private async _printTransaction(tx: TransactionReceipt) {
    let output = "";

    if (tx.contractAddress) {
      output += `> contractAddress: ${tx.contractAddress}\n`;
    }

    output += `> blockNumber: ${tx.blockNumber}\n`;

    output += `> blockTimestamp: ${(await tx.getBlock()).timestamp}\n`;

    output += `> account: ${tx.from}\n`;

    output += `> balance: ${await tx.provider.getBalance(tx.from)} ${await this._getNativeSymbol()}\n`;

    output += `> gasUsed: ${tx.gasUsed.toString()}\n`;

    output += `> gasPrice: ${tx.gasPrice.toString()} ${await this._getNativeSymbol()}\n`;

    output += `> fee: ${tx.fee.toString()} ${await this._getNativeSymbol()}\n`;

    console.log(output);
  }

  private _reportMigrationFiles(files: string[]) {
    console.log("\nMigration files:");

    files.forEach((file) => {
      console.log(`> ${file}`);
    });

    console.log("");
  }

  private async _getNetwork(): Promise<Network> {
    return this._hre.ethers.provider.getNetwork();
  }

  private async _getChainId(): Promise<number> {
    return Number((await this._getNetwork()).chainId);
  }

  private async _reportChainInfo() {
    // await this._hre.ethers.provider.getNetwork();
    console.log(`> ${"Network:".padEnd(20)} ${(await this._getNetwork()).name}`);

    console.log(`> ${"Network id:".padEnd(20)} ${await this._getChainId()}`);
  }

  private async _getExplorerUrl(): Promise<string> {
    const chainId = await this._getChainId();

    if (predefinedChains[chainId]) {
      const explorers = predefinedChains[chainId].explorers;

      if (!explorers || explorers.length === 0) {
        return "";
      }

      return explorers[0].url;
    }

    try {
      const chain = await this._getChainMetadataById(chainId);

      if (chain) {
        predefinedChains[chainId] = chain;

        const explorers = predefinedChains[chainId].explorers;

        if (!explorers || explorers.length === 0) {
          return "";
        }

        return explorers[0].url;
      }
    } catch (e) {
      console.warn(`Unable to get explorer url for chainId ${chainId}.`, e);
    }

    return "";
  }

  private async _getNativeSymbol(): Promise<string> {
    const chainId = Number((await this._hre.ethers.provider.getNetwork()).chainId);

    if (predefinedChains[chainId]) {
      return predefinedChains[chainId].nativeCurrency.symbol;
    }

    try {
      const chain = await this._getChainMetadataById(chainId);

      if (chain) {
        predefinedChains[chainId] = chain;

        return chain.nativeCurrency.symbol;
      }
    } catch (e) {
      console.warn(`Unable to get native symbol for chainId ${chainId}.`, e);
    }

    return defaultCurrencySymbol;
  }

  private async _getChainMetadataById(chainId: number): Promise<ChainRecord | undefined> {
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

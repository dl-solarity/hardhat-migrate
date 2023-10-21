/* eslint-disable no-console */
import ora from "ora";
import axios from "axios";
import BigNumber from "bignumber.js";

import { Network, TransactionReceipt, TransactionResponse } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { MigrateError } from "../../errors";

import { catchError, underline } from "../../utils";

import { ChainRecord, predefinedChains } from "../../types/verifier";

@catchError
export class Reporter {
  private static _hre: HardhatRuntimeEnvironment = {} as HardhatRuntimeEnvironment;

  private static totalCost: bigint = 0n;
  private static totalTransactions: number = 0;

  public static init(hre: HardhatRuntimeEnvironment) {
    this._hre = hre;
  }

  public static async reportMigrationBegin(files: string[]) {
    this._reportMigrationFiles(files);

    await this._reportChainInfo();

    console.log("\nStarting migration...\n");
  }

  public static reportMigrationFileBegin(file: string) {
    console.log(`\n${underline(`Running ${file}...`)}`);
  }

  public static async summary() {
    const output =
      `> ${"Total transactions:".padEnd(20)} ${this.totalTransactions}\n` +
      `> ${"Final cost:".padEnd(20)} ${this.castAmount(this.totalCost, await this._getNativeSymbol())}\n`;

    console.log(output);
  }

  public static async reportTransactionByHash(txHash: string, instanceName: string) {
    const tx = await this._hre.ethers.provider.getTransaction(txHash);

    if (!tx) {
      throw new MigrateError("Transaction not found.");
    }

    await this.reportTransaction(tx, instanceName);
  }

  public static async reportTransaction(tx: TransactionResponse, instanceName: string) {
    const timeStart = Date.now();

    console.log("\n" + underline(this._parseTransactionTitle(tx, instanceName)));

    console.log(`> explorer: ${await this._getExplorerLink(tx.hash)}`);

    const spinner = ora(await this._formatPendingTime(tx, timeStart)).start();

    const spinnerInterval = setInterval(
      async () => (spinner.text = await this._formatPendingTime(tx as TransactionResponse, timeStart)),
      1000,
    );

    const wait = tx.wait();

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

  public static notifyDeploymentInsteadOfRecovery(contractName: string): void {
    const output = `\nCan't recover contract address for ${contractName}. Deploying instead...`;

    console.log(output);
  }

  public static notifyDeploymentOfMissingLibrary(libraryName: string): void {
    const output = `\nDeploying missing library ${libraryName}...`;

    console.log(output);
  }

  public static notifyTransactionSendingInsteadOfRecovery(contractMethod: string): void {
    const output = `\nCan't recover transaction for ${contractMethod}. Sending instead...`;

    console.log(output);
  }

  public static notifyContractRecovery(contractName: string, contractAddress: string): void {
    const output = `\nContract address for ${contractName} has been recovered: ${contractAddress}\n`;

    console.log(output);
  }

  public static notifyTransactionRecovery(methodString: string): void {
    const output = `\nTransaction ${methodString} has been recovered.\n`;

    console.log(output);
  }

  public static reportVerificationBatchBegin() {
    console.log("\nStarting verification of all deployed contracts\n");
  }

  public static reportSuccessfulVerification(contractAddress: string, contractName: string) {
    const output = `\nContract ${contractName} (${contractAddress}) verified successfully.\n`;

    console.log(output);
  }

  public static reportAlreadyVerified(contractAddress: string, contractName: string) {
    const output = `\nContract ${contractName} (${contractAddress}) already verified.\n`;

    console.log(output);
  }

  public static reportVerificationError(contractAddress: string, contractName: string, message: string) {
    const output = `\nContract ${contractName} (${contractAddress}) verification failed: ${message}\n`;

    console.log(output);
  }

  private static _parseTransactionTitle(tx: TransactionResponse, instanceName: string): string {
    if (tx.to === null) {
      if (instanceName.split(":").length == 1) {
        return `Deploying ${instanceName}`;
      }

      return `Deploying${instanceName ? " " + instanceName.split(":")[1] : ""}`;
    }

    return `Transaction: ${instanceName}`;
  }

  private static async _formatPendingTime(tx: TransactionResponse, startTime: number): Promise<string> {
    return `Blocks: ${await tx.confirmations()} Seconds: ${((Date.now() - startTime) / 1000).toFixed(0)}`;
  }

  private static async _getExplorerLink(txHash: string): Promise<string> {
    return (await this._getExplorerUrl()) + "/tx/" + txHash;
  }

  private static async _printTransaction(tx: TransactionReceipt) {
    let output = "";

    if (tx.contractAddress) {
      output += `> contractAddress: ${tx.contractAddress}\n`;
    }

    const nativeSymbol = await this._getNativeSymbol();

    output += `> blockNumber: ${tx.blockNumber}\n`;

    output += `> blockTimestamp: ${(await tx.getBlock()).timestamp}\n`;

    output += `> account: ${tx.from}\n`;

    output += `> balance: ${this.castAmount(await tx.provider.getBalance(tx.from), nativeSymbol)}\n`;

    output += `> gasUsed: ${tx.gasUsed}\n`;

    output += `> gasPrice: ${this.castAmount(tx.gasPrice, nativeSymbol)}\n`;

    output += `> fee: ${this.castAmount(tx.fee, nativeSymbol)}\n`;

    console.log(output);
  }

  public static castAmount(value: bigint, nativeSymbol: string): string {
    if (value < 10n ** 12n) {
      return this._toGWei(value) + " GWei";
    }

    return this._toEther(value) + ` ${nativeSymbol}`;
  }

  private static _toEther(value: bigint): string {
    return BigNumber(value.toString())
      .div(10 ** 18)
      .toFixed();
  }

  private static _toGWei(value: bigint): string {
    return BigNumber(value.toString())
      .div(10 ** 9)
      .toFixed();
  }

  private static _reportMigrationFiles(files: string[]) {
    console.log("\nMigration files:");

    files.forEach((file) => {
      console.log(`> ${file}`);
    });

    console.log("");
  }

  private static async _reportChainInfo() {
    console.log(`> ${"Network:".padEnd(20)} ${(await this._getNetwork()).name}`);

    console.log(`> ${"Network id:".padEnd(20)} ${await this._getChainId()}`);
  }

  private static async _getNetwork(): Promise<Network> {
    try {
      return this._hre.ethers.provider.getNetwork();
    } catch {
      return new Network("Local Ethereum", 1337);
    }
  }

  private static async _getChainId(): Promise<number> {
    try {
      return Number((await this._getNetwork()).chainId);
    } catch {
      return 1337;
    }
  }

  private static async _getExplorerUrl(): Promise<string> {
    const chainId = await this._getChainId();

    if (predefinedChains[chainId]) {
      const explorers = predefinedChains[chainId].explorers;

      return !explorers || explorers.length === 0 ? "" : explorers[0].url;
    }

    const chain = await this._getChainMetadataById(chainId);

    return chain.explorers[0].url;
  }

  private static async _getNativeSymbol(): Promise<string> {
    const chainId = await this._getChainId();

    if (predefinedChains[chainId]) {
      return predefinedChains[chainId].nativeCurrency.symbol;
    }

    const chain = await this._getChainMetadataById(chainId);

    return chain.nativeCurrency.symbol;
  }

  private static async _getChainMetadataById(chainId: number): Promise<ChainRecord> {
    try {
      const chains = await this._tryGetAllRecords();

      const chain = chains.find((chain) => chain.chainId === chainId);

      if (chain) {
        predefinedChains[chainId] = chain;

        return chain;
      }

      return predefinedChains[1337];
    } catch {
      return predefinedChains[1337];
    }
  }

  private static async _tryGetAllRecords(): Promise<ChainRecord[]> {
    const url = "https://chainid.network/chains.json";
    const response = await axios.get(url);

    // Assuming the JSON response is an array of record objects
    return response.data as ChainRecord[];
  }
}

/* eslint-disable no-console */
import ora from "ora";
import { TransactionReceipt, TransactionResponse } from "ethers";

import { Reporter } from "./Reporter";

import { Provider } from "../Provider";

import { underline } from "../../utils";

import { MigrateError } from "../../errors";

export class PublicReporter extends Reporter {
  public static async reportTransactionByHash(txHash: string, instanceName: string) {
    const tx = await Provider.provider.getTransaction(txHash);

    if (!tx) {
      throw new MigrateError("Transaction not found.");
    }

    await this.reportTransactionResponse(tx, instanceName);
  }

  public static async reportTransactionResponse(tx: TransactionResponse, instanceName: string) {
    console.log("\n" + underline(this._parseTransactionTitle(tx, instanceName)));

    console.log(`> explorer: ${this._getExplorerLink(tx.hash)}`);

    let receipt;
    if (tx.isMined()) {
      receipt = (await tx.wait())!;
    } else {
      receipt = await this._showTransactionMining(tx);
    }

    await this._printTransactionReceipt(receipt);

    this.totalCost += receipt.fee + tx.value ?? 0n;
    this.totalTransactions++;
  }

  public static reportContracts(...contracts: [string, string][]): void {
    const table: { Contract: string; Address: string }[] = contracts.map(([contract, address]) => ({
      Contract: contract,
      Address: address,
    }));
    console.log();
    console.table(table);
    console.log();
  }

  protected static async _showTransactionMining(tx: TransactionResponse) {
    const timeStart = Date.now();
    const blockStart = await Provider.provider.getBlockNumber();

    const formatPendingTimeTask = async () => this._formatPendingTime(tx, timeStart, blockStart);

    const spinner = ora(await formatPendingTimeTask()).start();

    // TODO: make 1000 configurable
    const spinnerInterval = setInterval(async () => (spinner.text = await formatPendingTimeTask()), 1000);

    let receipt: TransactionReceipt;
    try {
      // We will wait for both contract deployment and common transactions
      receipt = (await tx.wait(this._config.wait))!;
    } catch (e: any) {
      throw new MigrateError(`Transaction failed: ${e.message}`);
    } finally {
      clearInterval(spinnerInterval);

      spinner.stop();
    }

    return receipt;
  }

  protected static async _printTransactionReceipt(receipt: TransactionReceipt) {
    let output = "";

    if (receipt.contractAddress) {
      output += `> contractAddress: ${receipt.contractAddress}\n`;
    }

    const nativeSymbol = this._nativeSymbol;

    output += `> blockNumber: ${receipt.blockNumber}\n`;

    output += `> blockTimestamp: ${(await receipt.getBlock()).timestamp}\n`;

    output += `> account: ${receipt.from}\n`;

    output += `> value: ${this._castAmount((await receipt.getTransaction()).value, nativeSymbol)}\n`;

    output += `> balance: ${this._castAmount(await receipt.provider.getBalance(receipt.from), nativeSymbol)}\n`;

    output += `> gasUsed: ${receipt.gasUsed}\n`;

    output += `> gasPrice: ${this._castAmount(receipt.gasPrice, nativeSymbol)}\n`;

    output += `> fee: ${this._castAmount(receipt.fee, nativeSymbol)}\n`;

    console.log(output);
  }
}

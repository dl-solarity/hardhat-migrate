import { TransactionResponse, TransactionReceipt } from "ethers";

import { HardhatRuntimeEnvironment } from "hardhat/types";

import { Reporter } from "../reporters/Reporter";

import { networkManager } from "../network/NetworkManager";

import { catchError } from "../../utils";

import { MigrateError } from "../../errors";

import { MigrateConfig } from "../../types/migrations";

@catchError
class BaseTransactionRunner {
  protected _config: MigrateConfig;

  protected totalCost: bigint = 0n;
  protected totalTransactions: bigint = 0n;

  constructor(config: MigrateConfig) {
    this._config = config;
  }

  public async reportTransactionResponse(tx: TransactionResponse, instanceName: string) {
    // Switch the default provider to the Wrapped provider, incorporating network error handling
    Object.defineProperty(tx, "provider", {
      value: networkManager!.provider,
      writable: true,
      configurable: true,
    });

    Reporter!.reportTransactionResponseHeader(tx, instanceName);

    let receipt;
    if (tx.isMined()) {
      receipt = (await tx.wait())!;
    } else {
      receipt = await this._showTransactionMining(tx);
    }

    await Reporter!.reportTransactionReceipt(receipt);

    this.totalCost += receipt.fee + tx.value ?? 0n;
    this.totalTransactions++;
  }

  public summary() {
    Reporter!.summary(this.totalTransactions, this.totalCost);
  }

  protected async _showTransactionMining(tx: TransactionResponse) {
    await Reporter!.startTxReporting(tx);

    let receipt: TransactionReceipt;
    try {
      // We will wait for both contract deployment and common transactions
      receipt = (await tx.wait(this._config.wait))!;
    } catch (e: any) {
      throw new MigrateError(`Transaction failed: ${e.message}`);
    } finally {
      Reporter!.stopSpinner();
    }

    return receipt;
  }
}

export let TransactionRunner: BaseTransactionRunner | null = null;

export function createTransactionRunner(hre: HardhatRuntimeEnvironment) {
  if (TransactionRunner) {
    return;
  }

  TransactionRunner = new BaseTransactionRunner(hre.config.migrate);
}

export function resetTransactionRunner() {
  TransactionRunner = null;
}

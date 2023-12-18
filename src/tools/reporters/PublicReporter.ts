/* eslint-disable no-console */
import { networkManager } from "../network/NetworkManager";

import { TransactionRunner } from "../runners/TransactionRunner";

import { MigrateError } from "../../errors";

export class PublicReporter {
  public static async reportTransactionByHash(txHash: string, name?: string) {
    const tx = await networkManager!.provider.getTransaction(txHash);

    if (!tx) {
      throw new MigrateError("Transaction not found.");
    }

    await TransactionRunner!.reportTransactionResponse(tx, name || "Unknown");
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
}

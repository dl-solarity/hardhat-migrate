/* eslint-disable no-console */

import { format } from "prettier";

import { Reporter } from "./Reporter";

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

  public static reportContracts(...contracts: [name: string, address: string][]): void {
    const table: { Contract: string; Address: string }[] = contracts.map(([contract, address]) => ({
      Contract: contract,
      Address: address,
    }));
    console.log();
    console.table(table);
    console.log();

    Reporter!.notifyStorageAboutContracts(contracts);
  }

  public static async reportContractsMD(...contracts: [name: string, address: string][]): Promise<void> {
    const explorer = await Reporter!.getExplorerUrl();

    let normalizedExplorer;
    try {
      normalizedExplorer = explorer !== "" ? new URL("address/", explorer).toString() : `address/`;
    } catch {
      normalizedExplorer = `address/`;
    }

    let markdownContent;

    const headers = [
      "| Contract      | Address                                    |",
      "|---------------|--------------------------------------------|",
    ];
    const rows = contracts.map(([contract, address]) => {
      return `| ${contract} | [${address}](${normalizedExplorer}${address}) |`;
    });

    markdownContent = [...headers, ...rows].join("\n");
    console.log(
      await format(markdownContent, {
        parser: "markdown",
        printWidth: 80,
        proseWrap: "always",
      }),
    );

    Reporter!.notifyStorageAboutContracts(contracts);
  }
}
